/**
 * KG Graph Linker
 *
 * Persists extracted entities and relationships into the knowledge graph,
 * deduplicating entities across documents via:
 *   1. Exact name match
 *   2. Alias match
 *   3. Embedding similarity (via find_kg_entities_by_embedding RPC)
 *
 * Called after entity extraction during document ingestion.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { embedChunks } from '@/src/lib/ingestion/embedder';
import type {
  ExtractedEntity,
  ExtractionResult,
} from './extractor';

// Minimum cosine similarity to consider two entity embeddings a match
const ENTITY_SIMILARITY_THRESHOLD = 0.85;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityIdMap = Map<string, string>; // entity name → kg_entities.id

// ---------------------------------------------------------------------------
// Main linking function
// ---------------------------------------------------------------------------

/**
 * Persist extracted entities and relationships into the KG tables.
 * Deduplicates entities against the existing graph.
 *
 * @param db           Supabase admin client (service_role)
 * @param documentId   The document being processed
 * @param extraction   Output of extractEntitiesAndRelationships()
 */
export async function linkToGraph(
  db: SupabaseClient,
  documentId: string,
  extraction: ExtractionResult,
): Promise<{ entitiesLinked: number; relationshipsCreated: number }> {
  const { entities, relationships } = extraction;
  if (entities.length === 0) return { entitiesLinked: 0, relationshipsCreated: 0 };

  // Step 1: Embed all entity names for similarity lookups
  const entityEmbeddings = await embedChunks(
    entities.map((e, i) => ({ chunkIndex: i, content: e.name })),
    'RETRIEVAL_DOCUMENT',
  );

  // Step 2: Resolve each entity — find existing or create new
  const entityIdMap: EntityIdMap = new Map();

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const embedding = entityEmbeddings[i];

    const resolvedId = await resolveEntity(db, entity, embedding.vector);
    entityIdMap.set(entity.name, resolvedId);

    // Create mention linking this entity to the document
    await db.from('kg_entity_mentions').insert({
      entity_id: resolvedId,
      document_id: documentId,
      chunk_id: null, // Extracted from full text; chunk linking is optional
      excerpt: entity.excerpt || null,
      confidence: entity.confidence,
    });
  }

  // Step 3: Create relationships
  let relationshipsCreated = 0;
  for (const rel of relationships) {
    const sourceId = entityIdMap.get(rel.sourceEntity);
    const targetId = entityIdMap.get(rel.targetEntity);
    if (!sourceId || !targetId) continue;

    const { error } = await db.from('kg_relationships').upsert(
      {
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: rel.type,
        document_id: documentId,
        weight: rel.weight,
        evidence_excerpt: rel.evidence || null,
      },
      {
        onConflict: 'source_entity_id,target_entity_id,relationship_type,document_id',
        ignoreDuplicates: true,
      },
    );

    if (!error) relationshipsCreated++;
  }

  return { entitiesLinked: entityIdMap.size, relationshipsCreated };
}

// ---------------------------------------------------------------------------
// Entity resolution
// ---------------------------------------------------------------------------

/**
 * Resolve an extracted entity against the existing graph.
 * Tries exact name → alias → embedding similarity → create new.
 */
async function resolveEntity(
  db: SupabaseClient,
  entity: ExtractedEntity,
  embeddingVector: string,
): Promise<string> {
  const name = entity.name;

  // 1. Exact name match
  const { data: exactMatch } = await db
    .from('kg_entities')
    .select('id')
    .eq('name', name)
    .eq('entity_type', entity.type)
    .limit(1)
    .single();

  if (exactMatch) {
    // Update aliases if we have new ones
    if (entity.aliases.length > 0) {
      await mergeAliases(db, exactMatch.id, entity.aliases);
    }
    return exactMatch.id;
  }

  // 2. Check if name matches any existing entity's alias
  // Using array contains operator — checks if any entity has this name as an alias
  const { data: aliasMatch } = await db
    .from('kg_entities')
    .select('id')
    .eq('entity_type', entity.type)
    .contains('aliases', [name])
    .limit(1)
    .single();

  if (aliasMatch) {
    return aliasMatch.id;
  }

  // 3. Embedding similarity match via RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: similarEntities } = await (db as any).rpc(
    'find_kg_entities_by_embedding',
    {
      query_vector: embeddingVector,
      match_count: 3,
      min_similarity: ENTITY_SIMILARITY_THRESHOLD,
    },
  );

  if (similarEntities && similarEntities.length > 0) {
    // Filter to same entity type for safety
    const sameType = (
      similarEntities as Array<{
        entity_id: string;
        entity_name: string;
        entity_type: string;
        similarity: number;
      }>
    ).find((e) => e.entity_type === entity.type);

    if (sameType) {
      // Merge: add current name as alias to the matched entity
      await mergeAliases(db, sameType.entity_id, [name, ...entity.aliases]);
      return sameType.entity_id;
    }
  }

  // 4. No match found — create new entity
  const { data: newEntity, error } = await db
    .from('kg_entities')
    .insert({
      name,
      entity_type: entity.type,
      aliases: entity.aliases,
      embedding: embeddingVector,
      metadata: {},
    })
    .select('id')
    .single();

  if (error || !newEntity) {
    throw new Error(`Failed to create KG entity "${name}": ${error?.message}`);
  }

  return newEntity.id;
}

/**
 * Merge new aliases into an existing entity's aliases array (deduped).
 */
async function mergeAliases(
  db: SupabaseClient,
  entityId: string,
  newAliases: string[],
): Promise<void> {
  const { data: entity } = await db
    .from('kg_entities')
    .select('aliases')
    .eq('id', entityId)
    .single();

  if (!entity) return;

  const existing = new Set<string>(
    (entity.aliases as string[]) ?? [],
  );
  for (const alias of newAliases) {
    if (alias.trim()) existing.add(alias.trim());
  }

  await db
    .from('kg_entities')
    .update({ aliases: [...existing] })
    .eq('id', entityId);
}

// ---------------------------------------------------------------------------
// Cleanup helper
// ---------------------------------------------------------------------------

/**
 * Remove all KG data for a document (for re-ingestion).
 */
export async function clearDocumentKG(
  db: SupabaseClient,
  documentId: string,
): Promise<void> {
  // Relationships reference document_id directly
  await db.from('kg_relationships').delete().eq('document_id', documentId);
  // Mentions reference document_id directly
  await db.from('kg_entity_mentions').delete().eq('document_id', documentId);
  // Note: We don't delete orphaned entities — they may be referenced
  // by other documents. A periodic cleanup job can handle orphans.
}

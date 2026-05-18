/**
 * KG Graph Retriever — third retrieval signal
 *
 * At query time:
 *   1. Extract entity names from the user query (lightweight LLM call)
 *   2. Resolve those names to KG entity IDs (embedding similarity)
 *   3. Call graph_search RPC to traverse the knowledge graph
 *   4. Return graph-ranked chunks to be merged with vector+FTS results
 *
 * Designed to run in parallel with hybrid_search to minimize latency.
 */

import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { MODELS } from '@/lib/config/models';
import { embedQuery } from '@/lib/ingestion/embedder';
import type { RetrievedChunk } from '../retriever';

// Re-export for convenience
export type GraphRetrievedChunk = RetrievedChunk & {
  graphRank: number;
};

// ---------------------------------------------------------------------------
// Query entity extraction (lightweight)
// ---------------------------------------------------------------------------

const QUERY_ENTITY_PROMPT = `Extract historical entity names from the user's question.
Return ONLY a JSON array of strings — each string being an entity name (person, event, place, date, concept).
Extract ALL entities mentioned or strongly implied. If no entities are found, return an empty array [].
No markdown, no explanation — just the JSON array.`;

/**
 * Extract entity names from a user query using a fast LLM call.
 * Returns an array of entity name strings.
 */
export async function extractQueryEntities(query: string): Promise<string[]> {
  try {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    });

    const { text } = await generateText({
      model: google(MODELS.fast),
      system: QUERY_ENTITY_PROMPT,
      messages: [{ role: 'user', content: query }],
    });

    const cleaned = text.replace(/```json?\s*|\s*```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) return [];
    return parsed.filter((e): e is string => typeof e === 'string' && e.trim().length > 0);
  } catch {
    // Non-fatal: if entity extraction fails, graph retrieval is skipped
    console.warn('[KG] Query entity extraction failed, skipping graph retrieval');
    return [];
  }
}

// ---------------------------------------------------------------------------
// Entity resolution (query entities → KG entity IDs)
// ---------------------------------------------------------------------------

/**
 * Resolve extracted query entity names to KG entity IDs.
 * Uses embedding similarity via find_kg_entities_by_embedding RPC.
 */
async function resolveQueryEntities(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  entityNames: string[],
): Promise<string[]> {
  if (entityNames.length === 0) return [];

  const entityIds = new Set<string>();

  // Resolve each entity name in parallel
  const results = await Promise.allSettled(
    entityNames.map(async (name) => {
      // First try exact name match (fast, no embedding needed)
      const { data: exactMatch } = await supabase
        .from('kg_entities')
        .select('id')
        .eq('name', name)
        .limit(1)
        .single();

      if (exactMatch) return [exactMatch.id as string];

      // Fall back to embedding similarity
      const queryVector = await embedQuery(name);
      const { data: similar } = await supabase.rpc(
        'find_kg_entities_by_embedding',
        {
          query_vector: queryVector,
          match_count: 3,
          min_similarity: 0.7,
        },
      );

      if (!similar || similar.length === 0) return [];
      return (similar as Array<{ entity_id: string }>).map((e) => e.entity_id);
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const id of result.value) {
        entityIds.add(id);
      }
    }
  }

  return [...entityIds];
}

// ---------------------------------------------------------------------------
// Graph search
// ---------------------------------------------------------------------------

/**
 * Perform full graph retrieval for a user query.
 * Extracts entities, resolves them, and traverses the knowledge graph.
 *
 * @param query     The user's query text
 * @param supabase  Authenticated Supabase client
 * @param options   Configuration options
 * @returns         Graph-ranked chunks, or empty array if no graph signal
 */
export async function retrieveGraphChunks(
  query: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  options: {
    maxHops?: number;
    matchCount?: number;
    entityNames?: string[]; // Pre-extracted entities (skip LLM call)
  } = {},
): Promise<GraphRetrievedChunk[]> {
  try {
    // Step 1: Extract entities from query (or use pre-extracted)
    const entityNames = options.entityNames ?? await extractQueryEntities(query);

    if (entityNames.length === 0) {
      console.log('[KG] No entities found in query, skipping graph retrieval');
      return [];
    }

    console.log(`[KG] Query entities: ${entityNames.join(', ')}`);

    // Step 2: Resolve entity names to KG entity IDs
    const entityIds = await resolveQueryEntities(supabase, entityNames);

    if (entityIds.length === 0) {
      console.log('[KG] No matching KG entities found, skipping graph retrieval');
      return [];
    }

    console.log(`[KG] Resolved ${entityIds.length} entity IDs`);

    // Step 3: Call graph_search RPC
    const { data, error } = await supabase.rpc('graph_search', {
      seed_entity_ids: entityIds,
      max_hops: options.maxHops ?? 2,
      match_count: options.matchCount ?? 30,
    });

    if (error) {
      console.warn('[KG] graph_search RPC failed:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    console.log(`[KG] Graph search returned ${data.length} chunks`);

    return (data as Array<{
      chunk_id: string;
      document_id: string;
      document_title: string;
      document_date: string | null;
      chunk_index: number;
      content: string;
      graph_rank: number;
    }>).map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      documentTitle: row.document_title,
      documentDate: row.document_date,
      chunkIndex: row.chunk_index,
      content: row.content,
      cosineScore: 0, // No cosine score from graph retrieval
      rrfScore: 0,    // Will be computed during merge
      graphRank: row.graph_rank,
    }));
  } catch (err) {
    console.warn('[KG] Graph retrieval failed:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Entity context for LLM prompt
// ---------------------------------------------------------------------------

export type EntityConnection = {
  entityName: string;
  entityType: string;
  connections: Array<{
    relatedEntity: string;
    relatedType: string;
    relationship: string;
  }>;
  disputes: Array<{
    entityA: string;
    entityB: string;
    relationship: string;
    evidence: string;
  }>;
};

/**
 * Fetch entity connections for the resolved query entities.
 * Used to build the ENTITY CONNECTIONS section in the LLM context.
 */
export async function fetchEntityConnections(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  entityIds: string[],
): Promise<EntityConnection[]> {
  if (entityIds.length === 0) return [];

  try {
    const connections: EntityConnection[] = [];

    for (const entityId of entityIds.slice(0, 5)) {
      // Fetch the entity itself
      const { data: entity } = await supabase
        .from('kg_entities')
        .select('name, entity_type')
        .eq('id', entityId)
        .single();

      if (!entity) continue;

      // Fetch outgoing relationships
      const { data: outgoing } = await supabase
        .from('kg_relationships')
        .select(`
          relationship_type,
          evidence_excerpt,
          target:kg_entities!kg_relationships_target_entity_id_fkey(name, entity_type)
        `)
        .eq('source_entity_id', entityId)
        .limit(15);

      // Fetch incoming relationships
      const { data: incoming } = await supabase
        .from('kg_relationships')
        .select(`
          relationship_type,
          evidence_excerpt,
          source:kg_entities!kg_relationships_source_entity_id_fkey(name, entity_type)
        `)
        .eq('target_entity_id', entityId)
        .limit(15);

      const conns: EntityConnection['connections'] = [];
      const disputes: EntityConnection['disputes'] = [];

      for (const rel of (outgoing ?? [])) {
        const target = rel.target as { name: string; entity_type: string } | null;
        if (!target) continue;

        if (rel.relationship_type === 'CONTRADICTS') {
          disputes.push({
            entityA: entity.name,
            entityB: target.name,
            relationship: rel.relationship_type,
            evidence: rel.evidence_excerpt ?? '',
          });
        } else {
          conns.push({
            relatedEntity: target.name,
            relatedType: target.entity_type,
            relationship: rel.relationship_type,
          });
        }
      }

      for (const rel of (incoming ?? [])) {
        const source = rel.source as { name: string; entity_type: string } | null;
        if (!source) continue;

        if (rel.relationship_type === 'CONTRADICTS') {
          disputes.push({
            entityA: source.name,
            entityB: entity.name,
            relationship: rel.relationship_type,
            evidence: rel.evidence_excerpt ?? '',
          });
        } else {
          conns.push({
            relatedEntity: source.name,
            relatedType: source.entity_type,
            relationship: rel.relationship_type,
          });
        }
      }

      connections.push({
        entityName: entity.name,
        entityType: entity.entity_type,
        connections: conns,
        disputes,
      });
    }

    return connections;
  } catch (err) {
    console.warn('[KG] Failed to fetch entity connections:', err);
    return [];
  }
}

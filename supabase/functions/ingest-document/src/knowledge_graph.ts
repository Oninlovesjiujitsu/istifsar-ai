import { createClient } from 'npm:@supabase/supabase-js@2';
import { embedBatch } from './embeddings.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ─── Auto-tagging ─────────────────────────────────────────────────────────────

export async function autoTag(
  db: ReturnType<typeof createClient>,
  docId: string,
  text: string,
): Promise<void> {
  const snippet = text.slice(0, 6000);

  const res = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_FLASH_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Extract historical entities from this document text. Return ONLY a JSON array of tag name strings (no explanation, no nesting). Include historical eras, geographic locations, historical figures, and significant events. Maximum 15 tags. Text:\n\n${snippet}`,
              },
            ],
          },
        ],
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini auto-tag error ${res.status}: ${body}`);
  }

  const geminiResponse = (await res.json()) as {
    candidates?: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const parts = geminiResponse.candidates?.[0]?.content?.parts ?? [];
  const rawText = parts.map((p) => p.text).join('').trim() || '[]';

  const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

  let tagNames: string[];
  try {
    tagNames = JSON.parse(cleaned);
    if (!Array.isArray(tagNames)) tagNames = [];
  } catch {
    console.warn('[ingest-document] autoTag: failed to parse tag JSON:', cleaned);
    return;
  }

  for (const rawName of tagNames.slice(0, 15)) {
    if (typeof rawName !== 'string' || !rawName.trim()) continue;

    const tagName = rawName.trim();
    const slug = tagName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) continue;

    await db.from('tags').upsert({ name: tagName, slug }, { onConflict: 'name', ignoreDuplicates: true });

    const { data: tag } = await db.from('tags').select('id').eq('name', tagName).single();
    if (!tag?.id) continue;

    await db.from('document_tags').upsert(
      { document_id: docId, tag_id: tag.id },
      { onConflict: 'document_id,tag_id', ignoreDuplicates: true },
    );
  }
}

// ─── Knowledge Graph extraction ───────────────────────────────────────────────

type KGEntity = {
  name: string;
  type: string;
  aliases: string[];
  excerpt: string;
  confidence: number;
};

type KGRelationship = {
  sourceEntity: string;
  targetEntity: string;
  type: string;
  evidence: string;
  weight: number;
};

const KG_EXTRACTION_PROMPT = `You are a knowledge graph extraction assistant specialized in historiography.
Given a scholarly document text, extract structured entities and relationships.

## Entity Types
- HISTORIAN: Named scholars, authors, or academics referenced in the text
- EVENT: Historical events (battles, treaties, revolutions, etc.)
- DATE: Specific dates, years, or time periods mentioned
- LOCATION: Geographic locations (cities, countries, regions, landmarks)
- CLAIM: Specific historical claims or arguments made by scholars
- SOURCE_REFERENCE: Primary sources, manuscripts, or documents cited
- CONCEPT: Historical concepts, movements, ideologies, or themes

## Relationship Types
- ARGUES: A historian makes a specific claim (HISTORIAN → CLAIM)
- CONTRADICTS: Two claims or entities are in factual contradiction (CLAIM → CLAIM)
- OCCURRED_AT: An event happened at a location (EVENT → LOCATION)
- PARTICIPATED_IN: A person was involved in an event (HISTORIAN/entity → EVENT)
- CITES: A historian references a primary source (HISTORIAN → SOURCE_REFERENCE)
- SUPPORTS: Evidence or a claim supports another claim (CLAIM → CLAIM)
- AUTHORED: A historian wrote a document or source (HISTORIAN → SOURCE_REFERENCE)
- ABOUT: An entity is about a topic/concept (any → CONCEPT)
- OCCURRED_DURING: An event happened during a time period (EVENT → DATE)
- RELATED_TO: General thematic or contextual connection

## Rules
1. Extract ALL meaningful entities — err on the side of inclusion
2. Entity names should be the most complete/formal version used in the text
3. Include aliases (alternative names, abbreviations, transliterations)
4. For CLAIM entities, state the claim concisely (under 30 words)
5. Confidence: 1.0 for explicitly stated, 0.8 for strongly implied, 0.6 for inferred
6. Excerpt: include a brief verbatim quote (max 40 words) where the entity appears
7. Weight: 1.0 for explicitly stated relationships, 0.7 for implied, 0.5 for inferred
8. CRITICAL: Ensure all strings in the JSON response are properly escaped. Any double quotes inside string fields (like name, aliases, excerpt, or evidence) MUST be escaped as \\" and any newlines MUST be escaped as \\n. Do not include unescaped control characters.
Respond strictly according to the requested JSON schema.`;

const VALID_ENTITY_TYPES = new Set([
  'HISTORIAN', 'EVENT', 'DATE', 'LOCATION', 'CLAIM', 'SOURCE_REFERENCE', 'CONCEPT',
]);
const VALID_REL_TYPES = new Set([
  'ARGUES', 'CONTRADICTS', 'OCCURRED_AT', 'PARTICIPATED_IN',
  'CITES', 'SUPPORTS', 'AUTHORED', 'ABOUT', 'OCCURRED_DURING', 'RELATED_TO',
]);

const ENTITY_SIMILARITY_THRESHOLD = 0.85;

export async function extractAndLinkKG(
  db: ReturnType<typeof createClient>,
  docId: string,
  chunks: Array<{ id: string; content: string }>,
  title: string,
  author: string | null,
): Promise<void> {
  await db.from('kg_relationships').delete().eq('document_id', docId);
  await db.from('kg_entity_mentions').delete().eq('document_id', docId);

  let totalEntities = 0;
  let totalRelationships = 0;
  const globalEntityIdMap = new Map<string, string>();

  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    const userPrompt = [
      `Document Title: "${title}"`,
      author ? `Author/Historian: ${author}` : null,
      `\n--- DOCUMENT CHUNK TEXT ---\n${chunk.content}\n--- END DOCUMENT CHUNK TEXT ---`,
      `\nExtract all entities and relationships from this text chunk.`,
    ].filter(Boolean).join('\n');

    try {
      const res = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_FLASH_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              { parts: [{ text: KG_EXTRACTION_PROMPT + '\n\n' + userPrompt }] },
            ],
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: 8192,
              responseSchema: {
                type: "OBJECT",
                properties: {
                  entities: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        type: { type: "STRING" },
                        aliases: { type: "ARRAY", items: { type: "STRING" } },
                        excerpt: { type: "STRING" },
                        confidence: { type: "NUMBER" },
                      },
                      required: ["name", "type", "aliases", "excerpt", "confidence"],
                    },
                  },
                  relationships: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        sourceEntity: { type: "STRING" },
                        targetEntity: { type: "STRING" },
                        type: { type: "STRING" },
                        evidence: { type: "STRING" },
                        weight: { type: "NUMBER" },
                      },
                      required: ["sourceEntity", "targetEntity", "type", "evidence", "weight"],
                    },
                  },
                },
                required: ["entities", "relationships"],
              },
            },
          }),
        },
      );

      if (!res.ok) {
        console.warn(`[ingest-document] KG API error for chunk ${cIdx}: ${await res.text()}`);
        continue;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const geminiResult = (await res.json()) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parts = geminiResult.candidates?.[0]?.content?.parts ?? [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawText = parts.map((p: any) => p.text).join('').trim() || '{}';
      
      let cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
      cleaned = cleaned
        .replace(/"type":\s*([A-Z_]+)(?=[,\s\n\}])/g, '"type": "$1"')
        .replace(/,\s*([\}\]])/g, '$1');

      let parsed: { entities?: KGEntity[]; relationships?: KGRelationship[] } = {};
      if (cleaned) {
        try {
          parsed = JSON.parse(cleaned);
        } catch {
          console.warn(`[ingest-document] KG JSON parse failed for chunk ${cIdx}`);
          continue;
        }
      }

      const entities = (parsed.entities ?? [])
        .map(e => ({ ...e, type: (e.type || '').toUpperCase() }))
        .filter(e => typeof e.name === 'string' && e.name.trim() && VALID_ENTITY_TYPES.has(e.type));

      if (entities.length === 0) continue;

      const entityVectors = await embedBatch(entities.map(e => e.name));

      for (let i = 0; i < entities.length; i++) {
        const entity = entities[i];
        let resolvedId = globalEntityIdMap.get(entity.name);
        
        if (!resolvedId) {
          const vectorStr = `[${entityVectors[i].join(',')}]`;
          resolvedId = await resolveKGEntity(db, entity, vectorStr);
          globalEntityIdMap.set(entity.name, resolvedId);
        }

        await db.from('kg_entity_mentions').insert({
          entity_id: resolvedId,
          document_id: docId,
          chunk_id: chunk.id,
          excerpt: (entity.excerpt ?? '').slice(0, 200) || null,
          confidence: typeof entity.confidence === 'number'
            ? Math.max(0, Math.min(1, entity.confidence))
            : 0.8,
        });
      }

      totalEntities += entities.length;

      const entityNames = new Set(entities.map(e => e.name));
      const relationships = (parsed.relationships ?? [])
        .map(r => ({ ...r, type: (r.type || '').toUpperCase() }))
        .filter(r => typeof r.sourceEntity === 'string' && typeof r.targetEntity === 'string' && VALID_REL_TYPES.has(r.type) && entityNames.has(r.sourceEntity) && entityNames.has(r.targetEntity));

      for (const rel of relationships) {
        const sourceId = globalEntityIdMap.get(rel.sourceEntity);
        const targetId = globalEntityIdMap.get(rel.targetEntity);
        if (!sourceId || !targetId) continue;

        const { error } = await db.from('kg_relationships').upsert(
          {
            source_entity_id: sourceId,
            target_entity_id: targetId,
            relationship_type: rel.type,
            document_id: docId,
            weight: typeof rel.weight === 'number' ? Math.max(0, Math.min(1, rel.weight)) : 0.7,
            evidence_excerpt: (rel.evidence ?? '').slice(0, 200) || null,
          },
          {
            onConflict: 'source_entity_id,target_entity_id,relationship_type,document_id',
            ignoreDuplicates: true,
          }
        );
        if (!error) totalRelationships++;
      }
    } catch (err) {
      console.warn(`[ingest-document] KG extraction failed for chunk ${cIdx}:`, err);
    }
  }

  console.log(`[ingest-document] KG Chunk Processing Complete: Processed ${chunks.length} chunks. Extracted ${totalEntities} entities and ${totalRelationships} relationships.`);
}

async function resolveKGEntity(
  db: ReturnType<typeof createClient>,
  entity: KGEntity,
  vectorStr: string,
): Promise<string> {
  const name = entity.name.trim();

  const { data: exactMatch } = await db
    .from('kg_entities')
    .select('id')
    .eq('name', name)
    .eq('entity_type', entity.type)
    .limit(1)
    .single();

  if (exactMatch) return exactMatch.id;

  const { data: aliasMatch } = await db
    .from('kg_entities')
    .select('id')
    .eq('entity_type', entity.type)
    .contains('aliases', [name])
    .limit(1)
    .single();

  if (aliasMatch) return aliasMatch.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: similar } = await (db as any).rpc('find_kg_entities_by_embedding', {
    query_vector: vectorStr,
    match_count: 3,
    min_similarity: ENTITY_SIMILARITY_THRESHOLD,
  });

  if (similar && similar.length > 0) {
    const sameType = (similar as Array<{ entity_id: string; entity_type: string }>)
      .find((e) => e.entity_type === entity.type);
    if (sameType) {
      const { data: existing } = await db
        .from('kg_entities')
        .select('aliases')
        .eq('id', sameType.entity_id)
        .single();
      if (existing) {
        const aliases = new Set<string>((existing.aliases as string[]) ?? []);
        aliases.add(name);
        for (const a of entity.aliases ?? []) {
          if (typeof a === 'string' && a.trim()) aliases.add(a.trim());
        }
        await db.from('kg_entities').update({ aliases: [...aliases] }).eq('id', sameType.entity_id);
      }
      return sameType.entity_id;
    }
  }

  const { data: newEntity, error } = await db
    .from('kg_entities')
    .insert({
      name,
      entity_type: entity.type,
      aliases: (entity.aliases ?? []).filter((a: string) => typeof a === 'string' && a.trim()),
      embedding: vectorStr,
      metadata: {},
    })
    .select('id')
    .single();

  if (error || !newEntity) {
    throw new Error(`Failed to create KG entity "${name}": ${error?.message}`);
  }

  return newEntity.id;
}

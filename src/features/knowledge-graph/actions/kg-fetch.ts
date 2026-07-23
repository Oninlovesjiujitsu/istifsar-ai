'use server';

import { createClient } from '@/src/lib/supabase/server';

export type DocumentKGData = {
  entities: Array<{
    id: string;
    name: string;
    entity_type: string;
    aliases: string[];
    excerpt: string | null;
    confidence: number;
  }>;
  relationships: Array<{
    id: string;
    source_name: string;
    target_name: string;
    relationship_type: string;
    weight: number;
    evidence_excerpt: string | null;
  }>;
};

export async function getDocumentKGData(documentId: string): Promise<DocumentKGData> {
  const supabase = await createClient();

  // Fetch entity mentions linked to this document
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: mentions } = await (supabase as any)
    .from('kg_entity_mentions')
    .select('excerpt, confidence, kg_entities(id, name, entity_type, aliases)')
    .eq('document_id', documentId);

  const entitiesMap = new Map<string, {
    id: string;
    name: string;
    entity_type: string;
    aliases: string[];
    excerpt: string | null;
    confidence: number;
  }>();

  for (const m of mentions ?? []) {
    const entity = m.kg_entities as { id: string; name: string; entity_type: string; aliases: string[] } | null;
    if (entity && !entitiesMap.has(entity.id)) {
      entitiesMap.set(entity.id, {
        id: entity.id,
        name: entity.name,
        entity_type: entity.entity_type,
        aliases: entity.aliases ?? [],
        excerpt: m.excerpt ?? null,
        confidence: m.confidence ?? 0.8,
      });
    }
  }

  // Fetch relationships originating from or targeting entities in this document
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rels } = await (supabase as any)
    .from('kg_relationships')
    .select('id, relationship_type, weight, evidence_excerpt, source:kg_entities!kg_relationships_source_entity_id_fkey(name), target:kg_entities!kg_relationships_target_entity_id_fkey(name)')
    .eq('document_id', documentId);

  const relationships = (rels ?? []).map((r: {
    id: string;
    relationship_type: string;
    weight: number;
    evidence_excerpt: string | null;
    source: { name: string } | null;
    target: { name: string } | null;
  }) => ({
    id: r.id,
    source_name: r.source?.name ?? 'Unknown Entity',
    target_name: r.target?.name ?? 'Unknown Entity',
    relationship_type: r.relationship_type,
    weight: r.weight ?? 0.7,
    evidence_excerpt: r.evidence_excerpt ?? null,
  }));

  return {
    entities: Array.from(entitiesMap.values()),
    relationships,
  };
}

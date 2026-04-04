'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import {
  getCachedCatalog,
  setCachedCatalog,
  type CatalogTag,
} from '@/lib/cache/redis';

/**
 * Fetch archive catalog: tags with published document counts.
 * Cached via Upstash Redis (TTL 1 hour). Returns only tags with count > 0.
 */
export async function getArchiveCatalog(): Promise<CatalogTag[]> {
  // Try cache first
  const cached = await getCachedCatalog();
  if (cached) return cached;

  const supabase = createAdminClient();

  // Fetch all tags
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .order('name');

  if (!tags || tags.length === 0) return [];

  // Count published documents per tag
  const tagIds = tags.map((t) => t.id);
  const { data: docTags } = await supabase
    .from('document_tags')
    .select('tag_id, document_id')
    .in('tag_id', tagIds);

  // Filter to only published documents
  const docIds = [...new Set((docTags ?? []).map((dt) => dt.document_id))];
  const publishedSet = new Set<string>();

  if (docIds.length > 0) {
    const { data: publishedDocs } = await supabase
      .from('documents')
      .select('id')
      .in('id', docIds)
      .eq('status', 'published');

    for (const doc of publishedDocs ?? []) {
      publishedSet.add(doc.id);
    }
  }

  // Build count map (only counting published docs)
  const countMap = new Map<string, number>();
  for (const row of docTags ?? []) {
    if (publishedSet.has(row.document_id)) {
      countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1);
    }
  }

  // Build result: only tags with at least 1 published document, sorted by count desc
  const result: CatalogTag[] = tags
    .map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      count: countMap.get(t.id) ?? 0,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);

  // Cache result
  await setCachedCatalog(result);

  return result;
}



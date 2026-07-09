import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/src/types/database';
import type { ContentionClaim, ContentionMeta } from '@/src/types/contention';

type RawClaim = {
  document_id?: string | null;
  claim?: string | null;
  excerpt?: string | null;
};

/**
 * Query the `contentions` table for open contentions involving any of the
 * given document IDs. Resolves document titles and author profiles so the
 * client receives a self-contained metadata payload.
 */
export async function queryContentions(
  supabase: SupabaseClient<Database>,
  documentIds: string[],
  authorByDocId: Map<string, { username: string; display_name: string }>,
  titleByDocId: Map<string, string>,
): Promise<ContentionMeta[]> {
  if (documentIds.length === 0) return [];

  const { data: rawContentions } = await supabase
    .from('contentions')
    .select('id, title, description, topic, claims, status, document_ids, created_at')
    .overlaps('document_ids', documentIds)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(5);

  if (!rawContentions || rawContentions.length === 0) return [];

  // Collect document IDs from contentions (including those referenced only
  // by claims) that we don't already have info for.
  const claimDocIds = rawContentions.flatMap((c) => {
    const claims = Array.isArray(c.claims) ? (c.claims as unknown as RawClaim[]) : [];
    return claims.map((cl) => cl.document_id).filter((id): id is string => !!id);
  });
  const allContentionDocIds = [
    ...new Set([...rawContentions.flatMap((c) => c.document_ids), ...claimDocIds]),
  ];
  const missingDocIds = allContentionDocIds.filter(
    (id) => !authorByDocId.has(id) && !titleByDocId.has(id),
  );

  // Fetch titles + authors for any missing docs
  const supplementaryTitles = new Map<string, string>();
  const supplementaryAuthors = new Map<string, { username: string; display_name: string }>();

  if (missingDocIds.length > 0) {
    const { data: extraDocs } = await supabase
      .from('documents')
      .select('id, title, profiles!documents_submitter_id_fkey(username, display_name)')
      .in('id', missingDocIds);

    if (extraDocs) {
      for (const doc of extraDocs) {
        supplementaryTitles.set(doc.id, doc.title);
        const profile = doc.profiles as unknown as {
          username: string;
          display_name: string;
        } | null;
        if (profile) supplementaryAuthors.set(doc.id, profile);
      }
    }
  }

  const titleFor = (id: string) =>
    titleByDocId.get(id) ?? supplementaryTitles.get(id) ?? 'Unknown Document';
  const authorFor = (id: string) =>
    authorByDocId.get(id) ?? supplementaryAuthors.get(id);

  // Deduplicate by contention ID (overlaps query can match the same row via multiple doc IDs)
  const deduped = new Map<string, ContentionMeta>();
  for (const c of rawContentions) {
    if (deduped.has(c.id)) continue;

    const rawClaims: RawClaim[] = Array.isArray(c.claims)
      ? (c.claims as unknown as RawClaim[])
      : [];

    const claims: ContentionClaim[] = rawClaims
      .filter((cl): cl is RawClaim & { document_id: string; claim: string } =>
        typeof cl.document_id === 'string' && typeof cl.claim === 'string',
      )
      .map((cl) => {
        const author = authorFor(cl.document_id);
        return {
          documentId: cl.document_id,
          documentTitle: titleFor(cl.document_id),
          scholarName: author?.display_name ?? 'Unknown Scholar',
          scholarUsername: author?.username ?? '',
          claim: cl.claim,
          excerpt: cl.excerpt ?? null,
        };
      });

    deduped.set(c.id, {
      contentionId: c.id,
      title: c.title,
      description: c.description,
      topic: c.topic,
      claims,
      status: c.status as 'open' | 'resolved' | 'disputed',
      documentIds: c.document_ids,
      documentTitles: c.document_ids.map(titleFor),
      scholarNames: c.document_ids.map((id) => authorFor(id)?.display_name ?? 'Unknown Scholar'),
      scholarUsernames: c.document_ids.map((id) => authorFor(id)?.username ?? ''),
    });
  }

  return [...deduped.values()];
}

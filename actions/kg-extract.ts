'use server';

/**
 * Server action to trigger KG extraction for an already-ingested document.
 * Used for backfilling existing documents that were ingested before KG-RAG.
 *
 * Restricted to admin users.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { extractEntitiesAndRelationships } from '@/lib/ai/kg/extractor';
import { linkToGraph, clearDocumentKG } from '@/lib/ai/kg/linker';

export async function extractDocumentKG(documentId: string): Promise<{
  success: boolean;
  error?: string;
  entities?: number;
  relationships?: number;
}> {
  // Auth check — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  try {
    const adminDb = createAdminClient();

    // Fetch document with its text (from first N chunks)
    const { data: doc } = await adminDb
      .from('documents')
      .select('id, title, submitter_id, profiles!documents_submitter_id_fkey(display_name)')
      .eq('id', documentId)
      .eq('status', 'published')
      .single();

    if (!doc) return { success: false, error: 'Document not found or not published' };

    // Reconstruct full text from chunks
    const { data: chunks } = await adminDb
      .from('document_chunks')
      .select('content')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (!chunks || chunks.length === 0) {
      return { success: false, error: 'No chunks found for document' };
    }

    const fullText = chunks.map((c) => c.content).join('\n\n');
    const authorName = (doc.profiles as { display_name?: string } | null)?.display_name ?? null;

    // Clear existing KG data for re-extraction
    await clearDocumentKG(adminDb, documentId);

    // Extract entities and relationships
    const extraction = await extractEntitiesAndRelationships(
      fullText,
      doc.title,
      authorName,
    );

    // Link to graph (with deduplication)
    const result = await linkToGraph(adminDb, documentId, extraction);

    return {
      success: true,
      entities: result.entitiesLinked,
      relationships: result.relationshipsCreated,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[KG Extract] Error:', msg);
    return { success: false, error: msg };
  }
}

/**
 * Batch KG extraction for all published documents that don't have KG data yet.
 * Admin only. Returns count of documents processed.
 */
export async function backfillKG(): Promise<{
  success: boolean;
  error?: string;
  processed?: number;
  failed?: number;
}> {
  // Auth check — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Admin access required' };
  }

  try {
    const adminDb = createAdminClient();

    // Find published documents without KG entity mentions
    // Cast to any: ingestion_status column added in migration 0006, not in generated types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: docs } = await (adminDb as any)
      .from('documents')
      .select('id')
      .eq('status', 'published')
      .eq('ingestion_status', 'done');

    if (!docs || docs.length === 0) {
      return { success: true, processed: 0, failed: 0 };
    }

    // Filter to only docs without existing KG mentions
    // Cast to any: kg_entity_mentions not in generated types yet
    const docIds = (docs as Array<{ id: string }>).map((d) => d.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingMentions } = await (adminDb as any)
      .from('kg_entity_mentions')
      .select('document_id')
      .in('document_id', docIds);

    const docsWithKG = new Set(
      ((existingMentions ?? []) as Array<{ document_id: string }>).map((m) => m.document_id),
    );
    const docsToProcess = docIds.filter((id) => !docsWithKG.has(id));

    let processed = 0;
    let failed = 0;

    for (const docId of docsToProcess) {
      try {
        const result = await extractDocumentKG(docId);
        if (result.success) {
          processed++;
          console.log(`[KG Backfill] ${docId}: ${result.entities} entities, ${result.relationships} relationships`);
        } else {
          failed++;
          console.warn(`[KG Backfill] ${docId} failed: ${result.error}`);
        }
      } catch {
        failed++;
      }
    }

    return { success: true, processed, failed };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: msg };
  }
}

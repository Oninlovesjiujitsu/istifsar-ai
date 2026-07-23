'use server';

/**
 * Server action to trigger Knowledge Graph entity extraction for a manuscript.
 * Can be triggered by the authoring Verified Historian or an Admin.
 */

import { createAdminClient } from '@/src/lib/supabase/admin';
import { createClient } from '@/src/lib/supabase/server';
import { extractEntitiesAndRelationships } from '@/src/lib/ai/kg/extractor';
import { linkToGraph, clearDocumentKG } from '@/src/lib/ai/kg/linker';
import { revalidatePath } from 'next/cache';

export async function extractDocumentKG(documentId: string): Promise<{
  success: boolean;
  error?: string;
  entities?: number;
  relationships?: number;
}> {
  // Auth check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  try {
    const adminDb = createAdminClient();

    // Fetch document with its metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: doc } = await (adminDb as any)
      .from('documents')
      .select('id, title, submitter_id, status, profiles!documents_submitter_id_fkey(display_name)')
      .eq('id', documentId)
      .single();

    if (!doc) return { success: false, error: 'Document not found' };

    // Authorization check: User must be author OR admin
    const isAuthor = doc.submitter_id === user.id;
    const isAdmin = role === 'admin';
    if (!isAuthor && !isAdmin) {
      return { success: false, error: 'Only the authoring historian or an admin can re-scan connections.' };
    }

    // Reconstruct full text from chunks
    const { data: chunks } = await adminDb
      .from('document_chunks')
      .select('content')
      .eq('document_id', documentId)
      .order('chunk_index');

    if (!chunks || chunks.length === 0) {
      return { success: false, error: 'No text chunks found for this manuscript. Ensure ingestion has completed.' };
    }

    const fullText = chunks.map((c) => c.content).join('\n\n');
    const authorName = (doc.profiles as { display_name?: string } | null)?.display_name ?? null;

    // Clear existing KG data for clean re-extraction
    await clearDocumentKG(adminDb, documentId);

    // Extract entities and relationships via Gemini AI
    const extraction = await extractEntitiesAndRelationships(
      fullText,
      doc.title,
      authorName,
    );

    // Link to graph (with deduplication)
    const result = await linkToGraph(adminDb, documentId, extraction);

    revalidatePath(`/publications/${documentId}`);

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

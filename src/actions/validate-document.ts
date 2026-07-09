'use server';

import { createClient } from '@/src/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserRole, isVerifiedHistorian } from '@/src/lib/ui/role-labels';
import { detectContentions } from '@/src/lib/ai/contention';
import { invalidateCatalogCache } from '@/src/lib/cache/redis';

export type ValidateResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Submit a validation decision on a document.
 * With the flat role system, any verified historian can validate.
 * A single approval publishes the document and triggers contention detection.
 */
export async function validateDocument(
  _prev: ValidateResult | null,
  formData: FormData,
): Promise<ValidateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const role = getUserRole(user);
  if (!isVerifiedHistorian(role)) {
    return { success: false, error: 'Verified Historian access required to validate documents.' };
  }

  const documentId = (formData.get('document_id') as string)?.trim();
  const decision = formData.get('decision') as string;
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!documentId) return { success: false, error: 'Missing document ID.' };
  if (!['approved', 'rejected', 'flagged'].includes(decision)) {
    return { success: false, error: 'Invalid decision.' };
  }

  // Verify document exists and belongs to someone else
  const { data: doc } = await supabase
    .from('documents')
    .select('id, status, submitter_id')
    .eq('id', documentId)
    .single();

  if (!doc) return { success: false, error: 'Document not found.' };
  if (doc.submitter_id === user.id) {
    return { success: false, error: 'You cannot validate your own submission.' };
  }

  // Check for existing validation
  const { data: existing } = await supabase
    .from('document_validations')
    .select('id')
    .eq('document_id', documentId)
    .eq('validator_id', user.id)
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: 'You have already submitted a decision for this document.',
    };
  }

  // Insert validation
  const { error: insertError } = await supabase.from('document_validations').insert({
    document_id: documentId,
    validator_id: user.id,
    decision,
    notes,
  });

  if (insertError) {
    return { success: false, error: `Could not save decision: ${insertError.message}` };
  }

  // If approved, check if the document should be published
  if (decision === 'approved') {
    const { count } = await supabase
      .from('document_validations')
      .select('id', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .eq('decision', 'approved');

    // Single approval publishes the document
    if ((count ?? 0) >= 1 && doc.status !== 'published') {
      await supabase
        .from('documents')
        .update({ status: 'published' })
        .eq('id', documentId);

      // Fire contention detection (non-blocking)
      void detectContentions(documentId);

      // Invalidate catalog cache so new document counts are reflected
      void invalidateCatalogCache();
    }
  }

  revalidatePath('/review');
  revalidatePath(`/review/${documentId}`);

  return { success: true };
}

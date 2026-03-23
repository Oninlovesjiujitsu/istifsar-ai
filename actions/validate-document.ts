'use server';

import { createClient } from '@/lib/supabase/server';
import { DOCUMENT_APPROVALS_REQUIRED } from '@/lib/config/constants';
import { revalidatePath } from 'next/cache';

export type ValidateResult =
  | { success: true }
  | { success: false; error: string };

export async function validateDocument(
  _prev: ValidateResult | null,
  formData: FormData,
): Promise<ValidateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const tier = (user.app_metadata?.tier as string) ?? 'pending';
  if (tier !== 'tier_1' && tier !== 'admin') {
    return { success: false, error: 'Tier 1 access required to validate documents.' };
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

  // Insert validation — RLS enforces no-self-approve and tier_1+ only
  const { error: insertError } = await supabase.from('document_validations').insert({
    document_id: documentId,
    validator_id: user.id,
    decision,
    notes,
  });

  if (insertError) {
    return { success: false, error: `Could not save decision: ${insertError.message}` };
  }

  // Recompute document status from all current validations
  const { data: allValidations } = await supabase
    .from('document_validations')
    .select('decision')
    .eq('document_id', documentId);

  const decisions = allValidations?.map((v) => v.decision) ?? [];
  const approvalCount = decisions.filter((d) => d === 'approved').length;
  const hasRejection = decisions.some((d) => d === 'rejected');

  let newStatus: string;
  const statusUpdate: Record<string, unknown> = {};

  if (hasRejection) {
    newStatus = 'rejected';
  } else if (approvalCount >= DOCUMENT_APPROVALS_REQUIRED) {
    newStatus = 'published';
    statusUpdate.published_at = new Date().toISOString();
  } else {
    newStatus = 'under_review';
  }

  await supabase
    .from('documents')
    .update({ status: newStatus, ...statusUpdate })
    .eq('id', documentId);

  revalidatePath('/contribute/validate');
  revalidatePath(`/contribute/validate/${documentId}`);

  return { success: true };
}

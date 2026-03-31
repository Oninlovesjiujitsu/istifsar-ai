'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const VALID_LINK_TYPES = ['google_scholar', 'faculty_page', 'doi'] as const;
type LinkType = (typeof VALID_LINK_TYPES)[number];

// ---------------------------------------------------------------------------
// submitVerificationRequest — any authenticated user
// ---------------------------------------------------------------------------

export async function submitVerificationRequest(linkType: string, linkUrl: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  if (!VALID_LINK_TYPES.includes(linkType as LinkType)) {
    throw new Error('Invalid link type');
  }

  const trimmedUrl = linkUrl.trim();
  if (!trimmedUrl) throw new Error('Link URL is required');

  // Prevent submission if user is already a verified historian or admin
  const role = (user.app_metadata?.role as string) ?? 'reader';
  if (role === 'verified_historian' || role === 'admin') {
    throw new Error('You already have Verified Historian access');
  }

  const { error } = await supabase.from('verification_requests').insert({
    user_id: user.id,
    link_type: linkType,
    link_url: trimmedUrl,
  });

  if (error) {
    // RLS policy prevents duplicate pending requests
    if (error.code === '23514' || error.message.includes('row-level security')) {
      throw new Error('You already have a pending verification request');
    }
    throw new Error(error.message);
  }

  revalidatePath('/profile');
}

// ---------------------------------------------------------------------------
// reviewVerificationRequest — admin only
// ---------------------------------------------------------------------------

export async function reviewVerificationRequest(
  requestId: string,
  decision: 'approved' | 'denied',
  reviewerNotes?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.role !== 'admin') throw new Error('Unauthorized');

  const admin = createAdminClient();

  // Fetch the request
  const { data: request, error: fetchError } = await admin
    .from('verification_requests')
    .select('id, user_id, status')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) throw new Error('Verification request not found');
  if (request.status !== 'pending') throw new Error('Request has already been reviewed');

  // Update request status
  const { error: updateError } = await admin
    .from('verification_requests')
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      reviewer_notes: reviewerNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) throw new Error(updateError.message);

  // On approval, upgrade user to verified_historian
  if (decision === 'approved') {
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'verified_historian', updated_at: new Date().toISOString() })
      .eq('id', request.user_id);

    if (profileError) throw new Error(profileError.message);

    // Sync role to JWT
    const { error: authError } = await admin.auth.admin.updateUserById(request.user_id, {
      app_metadata: { role: 'verified_historian' },
    });

    if (authError) throw new Error(authError.message);
  }

  revalidatePath('/admin/admin-review');
}

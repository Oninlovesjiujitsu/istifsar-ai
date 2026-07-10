'use server';

import { createClient } from '@/src/lib/supabase/server';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ---------------------------------------------------------------------------
// signUpHistorian — admin-created account (no email verification)
// ---------------------------------------------------------------------------

export async function signUpHistorian(
  displayName: string,
  email: string,
  password: string,
  scholarUrl: string,
) {
  const trimmedName = displayName.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedUrl = scholarUrl.trim();

  if (!trimmedName) throw new Error('Display name is required');
  if (!trimmedEmail) throw new Error('Email is required');
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  if (!trimmedUrl) throw new Error('Google Scholar profile link is required');

  const admin = createAdminClient();

  // Create user via admin API — email is auto-confirmed, no verification email sent
  const { data, error } = await admin.auth.admin.createUser({
    email: trimmedEmail,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: trimmedName,
      role_preference: 'historian',
    },
  });

  if (error) throw new Error(error.message);

  // handle_new_user() trigger already created the profile with 'reader' role.
  // Now create the verification request with the Google Scholar link.
  const { error: vrError } = await admin
    .from('verification_requests')
    .insert({
      user_id: data.user.id,
      link_type: 'google_scholar' as const,
      link_url: trimmedUrl,
    });

  if (vrError) throw new Error(vrError.message);
}

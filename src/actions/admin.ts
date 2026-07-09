'use server';

import { createClient } from '@/src/lib/supabase/server';
import { createAdminClient } from '@/src/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const VALID_ROLES = ['reader', 'verified_historian', 'admin'] as const;
type Role = (typeof VALID_ROLES)[number];

// ---------------------------------------------------------------------------
// changeRole
// ---------------------------------------------------------------------------

/** Change a user's role. Caller must be admin. */
export async function changeRole(userId: string, role: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== 'admin') throw new Error('Unauthorized');

  if (!VALID_ROLES.includes(role as Role)) {
    throw new Error('Invalid role value');
  }

  const admin = createAdminClient();

  // Update the profiles table
  const { error: profileError } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  // Sync to JWT app_metadata so the claim is updated on next login
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (authError) throw new Error(authError.message);

  revalidatePath('/admin/users');
}

// ---------------------------------------------------------------------------
// resolveContention
// ---------------------------------------------------------------------------

/** Mark a contention as resolved or disputed. Caller must be admin. */
export async function resolveContention(
  contentionId: string,
  resolutionNotes: string,
  newStatus: 'resolved' | 'disputed',
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.role !== 'admin') throw new Error('Unauthorized');

  const admin = createAdminClient();

  const { error } = await admin
    .from('contentions')
    .update({
      status: newStatus,
      resolution_notes: resolutionNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contentionId);

  if (error) throw new Error(error.message);

  revalidatePath('/admin/contentions');
}

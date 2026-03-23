'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const VALID_TIERS = ['pending', 'reader', 'tier_3', 'tier_2', 'tier_1', 'admin'] as const;
type Tier = (typeof VALID_TIERS)[number];

// ---------------------------------------------------------------------------
// changeTier
// ---------------------------------------------------------------------------

/** Change a user's tier. Caller must be admin. */
export async function changeTier(userId: string, tier: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.app_metadata?.tier !== 'admin') throw new Error('Unauthorized');

  if (!VALID_TIERS.includes(tier as Tier)) {
    throw new Error('Invalid tier value');
  }

  const admin = createAdminClient();

  // Update the profiles table
  const { error: profileError } = await admin
    .from('profiles')
    .update({ tier })
    .eq('id', userId);

  if (profileError) throw new Error(profileError.message);

  // Sync to JWT app_metadata so the claim is updated on next login
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { tier },
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
  if (user?.app_metadata?.tier !== 'admin') throw new Error('Unauthorized');

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

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateDisplayName(
  displayName: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const trimmed = displayName.trim();
  if (!trimmed) return { error: 'Display name cannot be empty' };
  if (trimmed.length > 100) return { error: 'Display name must be 100 characters or fewer' };

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: trimmed })
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/account');
  return {};
}

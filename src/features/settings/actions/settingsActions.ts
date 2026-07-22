'use server';

import { createClient } from '@/src/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { UserPreferences } from '@/src/types/preferences';

export async function updateUserPreferencesAction(
  preferences: UserPreferences,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase.auth.updateUser({
    data: {
      preferences: {
        citation_style: preferences.citation_style,
        ai_response_depth: preferences.ai_response_depth,
      },
    },
  });

  if (error) return { error: error.message };

  revalidatePath('/settings');
  revalidatePath('/account');
  return {};
}

export async function updatePasswordAction(
  newPassword: string,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  if (!newPassword || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters long' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) return { error: error.message };

  return {};
}

'use server';

import { createClient } from '@/src/lib/supabase/server';
import type { TablesUpdate } from '@/src/types/database';
import { revalidatePath } from 'next/cache';

export async function updateDisplayName(
  displayName: string,
): Promise<{ error?: string }> {
  return updateFullProfile({ displayName });
}

export interface ProfileUpdateInput {
  displayName?: string;
  username?: string;
  bio?: string;
  institution?: string;
  avatarUrl?: string;
}

/**
 * Server action to upload a local avatar image file from the user's device.
 */
export async function uploadAvatarImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const file = formData.get('avatar') as File | null;
  if (!file || file.size === 0) {
    return { error: 'No image file selected.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Avatar image file must be under 5 MB.' };
  }

  const ext = file.name.split('.').pop() || 'png';
  const filePath = `avatars/${user.id}/${Date.now()}.${ext}`;

  // Try uploading to 'avatars' storage bucket
  const { error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadErr) {
    // Fallback: If avatars bucket doesn't exist or RLS issue, convert file to data URL
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
      return { url: base64 };
    } catch {
      return { error: `Image upload failed: ${uploadErr.message}` };
    }
  }

  const { data: publicUrlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return { url: publicUrlData.publicUrl };
}

export async function updateFullProfile(
  input: ProfileUpdateInput,
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Not authenticated' };

  const updates: TablesUpdate<'profiles'> = {
    updated_at: new Date().toISOString(),
  };

  if (input.displayName !== undefined) {
    const trimmedName = input.displayName.trim();
    if (!trimmedName) return { error: 'Display name cannot be empty' };
    if (trimmedName.length > 100) return { error: 'Display name must be 100 characters or fewer' };
    updates.display_name = trimmedName;
  }

  if (input.username !== undefined) {
    const trimmedUsername = input.username.trim().toLowerCase();
    if (!trimmedUsername) return { error: 'Username cannot be empty' };
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return { error: 'Username must be between 3 and 30 characters' };
    }
    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      return { error: 'Username can only contain letters, numbers, and underscores' };
    }

    // Check uniqueness if username changed
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', trimmedUsername)
      .neq('id', user.id)
      .maybeSingle();

    if (existing) {
      return { error: 'Username is already taken by another scholar' };
    }
    updates.username = trimmedUsername;
  }

  if (input.bio !== undefined) {
    const trimmedBio = input.bio.trim();
    if (trimmedBio.length > 500) return { error: 'Bio must be 500 characters or fewer' };
    updates.bio = trimmedBio || null;
  }

  if (input.institution !== undefined) {
    const trimmedInst = input.institution.trim();
    if (trimmedInst.length > 150) return { error: 'Institution must be 150 characters or fewer' };
    updates.institution = trimmedInst || null;
  }

  if (input.avatarUrl !== undefined) {
    const trimmedAvatar = input.avatarUrl.trim();
    if (trimmedAvatar && !/^(https?:\/\/|data:image\/).+/.test(trimmedAvatar)) {
      return { error: 'Avatar URL must be a valid http link or image file' };
    }
    updates.avatar_url = trimmedAvatar || null;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/settings');
  revalidatePath('/account');
  return {};
}

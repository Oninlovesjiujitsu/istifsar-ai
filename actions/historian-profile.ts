'use server';

import { createClient } from '@/lib/supabase/server';

export type HistorianProfile = {
  displayName: string;
  username: string;
  bio: string | null;
  institution: string | null;
  role: string;
  avatarUrl: string | null;
  joinedAt: string;
  publicationCount: number;
  essayCount: number;
};

export async function getHistorianProfile(
  username: string,
): Promise<HistorianProfile | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, institution, role, created_at, avatar_url')
    .eq('username', username)
    .single();

  if (!profile) return null;

  const [{ count: pubCount }, { count: essayCount }] = await Promise.all([
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('submitter_id', profile.id)
      .eq('status', 'published'),
    supabase
      .from('living_essays')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', profile.id)
      .eq('status', 'published'),
  ]);

  return {
    displayName: profile.display_name,
    username: profile.username,
    bio: profile.bio,
    institution: profile.institution,
    role: profile.role,
    avatarUrl: profile.avatar_url,
    joinedAt: profile.created_at,
    publicationCount: pubCount ?? 0,
    essayCount: essayCount ?? 0,
  };
}

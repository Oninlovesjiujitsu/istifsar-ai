'use server';

import { createClient } from '@/src/lib/supabase/server';
import { createAdminClient } from '@/src/lib/supabase/admin';

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
  citationCount: number;
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

  const [{ count: pubCount }, { count: essayCount }, { data: docs }] = await Promise.all([
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
    supabase
      .from('documents')
      .select('id')
      .eq('submitter_id', profile.id)
      .eq('status', 'published'),
  ]);

  let citationCount = 0;
  const docIds = docs?.map((d) => d.id) ?? [];
  if (docIds.length > 0) {
    const admin = createAdminClient();
    const { count } = await admin
      .from('citations')
      .select('id', { count: 'exact', head: true })
      .in('document_id', docIds);
    citationCount = count ?? 0;
  }

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
    citationCount,
  };
}

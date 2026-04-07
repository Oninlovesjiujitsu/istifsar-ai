import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ProfileContent from '@/components/profile/ProfileContent';
import type { Metadata } from 'next';

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Istifsar` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, institution, role, created_at, avatar_url')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  const [
    { data: publications },
    { data: essays },
    { data: paths },
  ] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, document_type, published_at, status')
      .eq('submitter_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('living_essays')
      .select('id, title, slug, published_at')
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('knowledge_paths')
      .select('id, title, slug, published_at')
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
  ]);

  return (
    <ProfileContent
      profile={profile}
      publications={publications}
      essays={essays}
      paths={paths}
    />
  );
}

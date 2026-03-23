import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import PathEditor from '@/components/paths/PathEditor';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Edit path — Istifsar' };

type PathNode = {
  id: string;
  position: number;
  node_type: string;
  body: string | null;
  document_id: string | null;
  essay_id: string | null;
};

export default async function EditPathPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: path } = await supabase
    .from('knowledge_paths')
    .select(
      'id, title, slug, description, author_id, path_nodes(id, position, node_type, body, document_id, essay_id)',
    )
    .eq('slug', slug)
    .single();

  if (!path) notFound();

  const tier = (user.app_metadata?.tier as string | undefined) ?? 'pending';
  const TIER_RANK: Record<string, number> = {
    pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
  };

  if (
    path.author_id !== user.id &&
    (TIER_RANK[tier] ?? 0) < TIER_RANK['tier_1']
  ) {
    redirect('/paths');
  }

  const nodes = (path.path_nodes as PathNode[] ?? [])
    .sort((a, b) => a.position - b.position)
    .map((n) => ({
      node_type: n.node_type as 'document' | 'essay' | 'question' | 'note',
      body: n.body,
      document_id: n.document_id,
      essay_id: n.essay_id,
      position: n.position,
    }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Edit path</h1>
      </div>
      <PathEditor
        pathId={path.id}
        initialData={{
          title: path.title,
          slug: path.slug,
          description: path.description ?? '',
          nodes,
        }}
      />
    </div>
  );
}

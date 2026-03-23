import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import EssayEditor from '@/components/essays/EssayEditor';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = { title: 'Edit essay — Istifsar' };

export default async function EditEssayPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: essay } = await supabase
    .from('living_essays')
    .select('id, title, slug, summary, lens_label, content, author_id')
    .eq('slug', slug)
    .single();

  if (!essay) notFound();

  const tier = (user.app_metadata?.tier as string | undefined) ?? 'pending';
  const TIER_RANK: Record<string, number> = {
    pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
  };

  if (
    essay.author_id !== user.id &&
    (TIER_RANK[tier] ?? 0) < TIER_RANK['tier_1']
  ) {
    redirect('/essays');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Edit essay</h1>
      </div>
      <EssayEditor
        essayId={essay.id}
        initialData={{
          title: essay.title,
          slug: essay.slug,
          summary: essay.summary ?? '',
          lensLabel: essay.lens_label ?? '',
          content: essay.content ?? '',
        }}
      />
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import EssayCard from '@/components/essays/EssayCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: "Historian's Perspectives — Istifsar" };

const TIER_RANK: Record<string, number> = {
  pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
};

export default async function EssaysPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tier = (user?.app_metadata?.tier as string | undefined) ?? 'pending';
  const canWrite = (TIER_RANK[tier] ?? 0) >= TIER_RANK['tier_2'];

  // Published essays
  const { data: publishedEssays } = await supabase
    .from('living_essays')
    .select('id, title, slug, summary, lens_label, published_at, profiles!author_id(display_name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // User's own draft essays (if writer)
  const { data: draftEssays } = canWrite
    ? await supabase
        .from('living_essays')
        .select('id, title, slug, summary, lens_label, created_at, status, profiles!author_id(display_name)')
        .in('status', ['draft', 'under_review'])
        .eq('author_id', user!.id)
        .order('created_at', { ascending: false })
    : { data: null };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Historian&apos;s perspectives</h1>
          <p className="text-muted-foreground">
            Interpretive essays that can be used as analytical lenses in your explorations.
          </p>
        </div>
        {canWrite && (
          <Link
            href="/essays/new"
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Write an essay
          </Link>
        )}
      </div>

      {/* Published essays */}
      {(publishedEssays?.length ?? 0) > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(publishedEssays ?? []).map((essay) => {
            const profile = essay.profiles as { display_name: string } | null;
            return (
              <EssayCard
                key={essay.id}
                id={essay.id}
                title={essay.title}
                slug={essay.slug}
                summary={essay.summary}
                lensLabel={essay.lens_label}
                authorName={profile?.display_name ?? 'Unknown'}
                publishedAt={essay.published_at}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No perspectives published yet.
          {canWrite && (
            <span>
              {' '}
              <Link href="/essays/new" className="text-primary hover:underline">
                Write the first one.
              </Link>
            </span>
          )}
        </div>
      )}

      {/* My drafts */}
      {canWrite && (draftEssays?.length ?? 0) > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            My drafts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(draftEssays ?? []).map((essay) => {
              const profile = essay.profiles as { display_name: string } | null;
              return (
                <div key={essay.id} className="relative">
                  <EssayCard
                    id={essay.id}
                    title={essay.title}
                    slug={essay.slug}
                    summary={essay.summary}
                    lensLabel={essay.lens_label}
                    authorName={profile?.display_name ?? 'You'}
                    publishedAt={null}
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {essay.status === 'under_review' && (
                      <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Under review
                      </span>
                    )}
                    <Link
                      href={`/essays/${essay.slug}/edit`}
                      className="rounded bg-background border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

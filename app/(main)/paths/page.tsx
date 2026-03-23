import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PathCard from '@/components/paths/PathCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Knowledge Paths — Istifsar' };

const TIER_RANK: Record<string, number> = {
  pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
};

export default async function PathsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tier = (user?.app_metadata?.tier as string | undefined) ?? 'pending';
  const isContributor = (TIER_RANK[tier] ?? 0) >= TIER_RANK['tier_3'];

  // Published paths
  const { data: publishedPaths } = await supabase
    .from('knowledge_paths')
    .select('id, title, slug, description, published_at, profiles!author_id(display_name)')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  // User's own draft paths (if contributor)
  const { data: draftPaths } = isContributor
    ? await supabase
        .from('knowledge_paths')
        .select('id, title, slug, description, created_at, profiles!author_id(display_name)')
        .eq('status', 'draft')
        .eq('author_id', user!.id)
        .order('created_at', { ascending: false })
    : { data: null };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Knowledge paths</h1>
          <p className="text-muted-foreground">
            Curated journeys through primary sources.
          </p>
        </div>
        {isContributor && (
          <Link
            href="/paths/new"
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Create a path
          </Link>
        )}
      </div>

      {/* Published paths */}
      {(publishedPaths?.length ?? 0) > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(publishedPaths ?? []).map((path) => {
            const profile = path.profiles as { display_name: string } | null;
            return (
              <PathCard
                key={path.id}
                id={path.id}
                title={path.title}
                slug={path.slug}
                description={path.description}
                authorName={profile?.display_name ?? 'Unknown'}
                publishedAt={path.published_at}
              />
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-muted-foreground">
          No paths published yet.
          {isContributor && (
            <span>
              {' '}
              <Link href="/paths/new" className="text-primary hover:underline">
                Be the first to create one.
              </Link>
            </span>
          )}
        </div>
      )}

      {/* My drafts */}
      {isContributor && (draftPaths?.length ?? 0) > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            My drafts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(draftPaths ?? []).map((path) => {
              const profile = path.profiles as { display_name: string } | null;
              return (
                <div key={path.id} className="relative">
                  <PathCard
                    id={path.id}
                    title={path.title}
                    slug={path.slug}
                    description={path.description}
                    authorName={profile?.display_name ?? 'You'}
                    publishedAt={null}
                  />
                  <Link
                    href={`/paths/${path.slug}/edit`}
                    className="absolute top-3 right-3 rounded bg-background border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

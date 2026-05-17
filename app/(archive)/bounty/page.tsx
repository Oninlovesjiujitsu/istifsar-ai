import { createClient } from '@/lib/supabase/server';
import BountyFilters from '@/components/explore/BountyFilters';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bounty Board — Istifsar' };

type Props = {
  searchParams: Promise<{ era?: string; geography?: string; subject?: string }>;
};

export default async function BountyBoardPage({ searchParams }: Props) {
  const filters = await searchParams;
  const supabase = await createClient();

  // Build filtered query
  let query = supabase
    .from('archive_gaps')
    .select('id, query_text, similarity_score, era, geography, subject, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (filters.era) query = query.eq('era', filters.era);
  if (filters.geography) query = query.eq('geography', filters.geography);
  if (filters.subject) query = query.eq('subject', filters.subject);

  const { data: gaps } = await query;

  // Fetch distinct filter values for dropdowns
  const { data: allGaps } = await supabase
    .from('archive_gaps')
    .select('era, geography, subject');

  const eras = [...new Set((allGaps ?? []).map((g) => g.era).filter((v): v is string => !!v))].sort();
  const geographies = [...new Set((allGaps ?? []).map((g) => g.geography).filter((v): v is string => !!v))].sort();
  const subjects = [...new Set((allGaps ?? []).map((g) => g.subject).filter((v): v is string => !!v))].sort();

  const hasFilters = !!(filters.era || filters.geography || filters.subject);

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-16 xl:p-24 relative">
      <header className="max-w-4xl mx-auto mb-8 sm:mb-12 mt-4 sm:mt-8 lg:mt-12">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gold/60">
          Unanswered questions
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-5xl font-heading text-gold leading-tight max-w-2xl mt-3 sm:mt-4">
          Bounty Board
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl">
          Questions the archive couldn&apos;t answer yet. Help historians know what
          to write about.
        </p>
        <div className="h-px w-24 bg-gradient-to-r from-gold to-transparent mt-6" />
      </header>

      {/* Filter bar */}
      <section className="max-w-4xl mx-auto mb-6">
        <BountyFilters eras={eras} geographies={geographies} subjects={subjects} />
      </section>

      <section className="max-w-4xl mx-auto">
        {gaps && gaps.length > 0 ? (
          <div className="divide-y divide-border rounded-lg border bg-card">
            {gaps.map((gap) => (
              <div key={gap.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{gap.query_text}</p>
                  {(gap.era || gap.geography || gap.subject) && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {gap.era && (
                        <span className="inline-block rounded bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                          {gap.era}
                        </span>
                      )}
                      {gap.geography && (
                        <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          {gap.geography}
                        </span>
                      )}
                      {gap.subject && (
                        <span className="inline-block rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {gap.subject}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {gap.similarity_score != null
                    ? `${(Number(gap.similarity_score) * 100).toFixed(0)}% match`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/20 py-16 text-center">
            <p className="text-muted-foreground">
              {hasFilters
                ? 'No gaps match the selected filters.'
                : 'No unanswered questions yet — the archive is doing well.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

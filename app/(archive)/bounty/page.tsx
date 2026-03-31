import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Bounty Board — Istifsar' };

export default async function BountyBoardPage() {
  const supabase = await createClient();

  const { data: gaps } = await supabase
    .from('archive_gaps')
    .select('id, query_text, similarity_score, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-16 xl:p-24 relative">
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

      <section className="max-w-4xl mx-auto">
        {gaps && gaps.length > 0 ? (
          <div className="divide-y divide-border rounded-lg border bg-card">
            {gaps.map((gap) => (
              <div key={gap.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{gap.query_text}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {gap.similarity_score != null
                    ? `${(gap.similarity_score * 100).toFixed(0)}% match`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-muted/20 py-16 text-center">
            <p className="text-muted-foreground">
              No unanswered questions yet — the archive is doing well.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

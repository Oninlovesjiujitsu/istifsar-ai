import { createClient } from '@/src/lib/supabase/server';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Target Bounties — Istifsar' };

export default async function TargetBountiesPage() {
  const supabase = await createClient();

  // Get all gaps — filtering by historian domain will be added
  // once the historian_domains table is created
  const { data: gaps } = await supabase
    .from('archive_gaps')
    .select('id, query_text, similarity_score, created_at')
    .order('similarity_score', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 xl:p-12 relative">
      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <span className="text-muted-foreground">Workspace</span>
        <span>/</span>
        <span className="text-primary font-medium">Target Bounties</span>
      </nav>

      <header className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary">
          Scholar Tasking
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-foreground leading-tight max-w-2xl mt-3 sm:mt-4">
          Target Bounties
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl text-sm leading-relaxed">
          Unanswered questions that need your expertise.
        </p>
        <div className="h-px w-24 bg-gradient-to-r from-border to-transparent mt-6" />
      </header>

      <section className="max-w-6xl mx-auto">
        {gaps && gaps.length > 0 ? (
          <div className="divide-y divide-border rounded-lg border bg-card shadow-sm">
            {gaps.map((gap) => (
              <div key={gap.id} className="px-6 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{gap.query_text}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(gap.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
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
              No unanswered questions yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

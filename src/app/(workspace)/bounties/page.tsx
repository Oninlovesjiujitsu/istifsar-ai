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
    .order('created_at', { ascending: false })
    .limit(15);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Target Bounties</h1>
        <p className="mt-1 text-muted-foreground">
          Unanswered questions that need your expertise.
        </p>
      </div>

      {gaps && gaps.length > 0 ? (
        <div className="divide-y divide-border rounded-lg border bg-card">
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
    </div>
  );
}

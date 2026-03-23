import { createAdminClient } from '@/lib/supabase/admin';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Unanswered Queries — Admin — Istifsar' };

export default async function AdminGapsPage() {
  const db = createAdminClient();

  // Use admin client so we can see gaps from all users
  const { data: gaps } = await db
    .from('archive_gaps')
    .select('id, query_text, similarity_score, mode, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(50);

  // Resolve user IDs to display names
  const userIds = [...new Set((gaps ?? []).map((g) => g.user_id).filter(Boolean) as string[])];
  let userNames: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);
    userNames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.display_name]));
  }

  const modeBadge = (mode: string) =>
    mode === 'interpreted'
      ? 'bg-primary/10 text-primary'
      : 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Unanswered Queries</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These are questions our archive couldn&apos;t answer — they guide what we add next.
        </p>
      </div>

      {gaps && gaps.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Query</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Similarity
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Mode</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {gaps.map((gap) => {
                const score = gap.similarity_score ?? 0;
                const pct = Math.round(score * 100);

                return (
                  <tr key={gap.id} className="hover:bg-muted/30 transition-colors">
                    <td className="max-w-sm px-4 py-3">
                      <p className="line-clamp-2">{gap.query_text}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {score.toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${modeBadge(gap.mode)}`}
                      >
                        {gap.mode === 'interpreted' ? 'Interpreted' : 'Raw evidence'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {gap.user_id ? (userNames[gap.user_id] ?? 'Unknown') : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {new Date(gap.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/20 py-16 text-center">
          <p className="text-muted-foreground">
            No unanswered queries yet. They appear here when the archive can&apos;t find a
            good enough source to answer a question.
          </p>
        </div>
      )}
    </div>
  );
}

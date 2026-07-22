import { createClient } from '@/src/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';
import CitationsChart from '@/src/features/dashboard/components/CitationsChart';

export const metadata: Metadata = { title: 'Impact Dashboard — Istifsar' };

export default async function HistorianDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  /* ── Data fetching ──────────────────────────────────────────────────── */

  const [
    { data: profile },
    { data: documents },
    { count: totalCitations },
    { count: pendingReviews },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single(),
    supabase
      .from('documents')
      .select('id, title, status, created_at, published_at')
      .eq('submitter_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('citations')
      .select('id', { count: 'exact', head: true })
      .in(
        'document_id',
        (await supabase.from('documents').select('id').eq('submitter_id', userId)).data?.map(
          (d) => d.id,
        ) ?? [],
      ),
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('submitter_id', userId)
      .eq('status', 'under_review'),
  ]);

  const publishedDocs = documents?.filter((d) => d.status === 'published') ?? [];
  const totalDocs = documents?.length ?? 0;

  /* ── Per-document citation counts (for top cited works) ─────────────── */

  const docIds = documents?.map((d) => d.id) ?? [];
  let topCited: Array<{
    id: string;
    title: string;
    status: string;
    published_at: string | null;
    citations: number;
  }> = [];

  if (docIds.length > 0) {
    const { data: citationRows } = await supabase
      .from('citations')
      .select('document_id')
      .in('document_id', docIds);

    const countMap: Record<string, number> = {};
    for (const row of citationRows ?? []) {
      countMap[row.document_id] = (countMap[row.document_id] ?? 0) + 1;
    }

    topCited = (documents ?? [])
      .map((doc) => ({
        id: doc.id,
        title: doc.title,
        status: doc.status,
        published_at: doc.published_at,
        citations: countMap[doc.id] ?? 0,
      }))
      .sort((a, b) => b.citations - a.citations)
      .slice(0, 5);
  }

  /* ── Monthly citation data (for chart) ──────────────────────────────── */

  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  let monthlyData: Array<{ month: string; currentYear: number; previousYear: number }> = [];

  if (docIds.length > 0) {
    const { data: recentCitations } = await supabase
      .from('citations')
      .select('created_at')
      .in('document_id', docIds)
      .gte('created_at', `${previousYear}-01-01`)
      .order('created_at', { ascending: true });

    const buckets: Record<string, { current: number; previous: number }> = {};
    for (const m of MONTHS) {
      buckets[m] = { current: 0, previous: 0 };
    }

    for (const row of recentCitations ?? []) {
      const d = new Date(row.created_at);
      const month = MONTHS[d.getMonth()];
      if (d.getFullYear() === currentYear) {
        buckets[month].current += 1;
      } else if (d.getFullYear() === previousYear) {
        buckets[month].previous += 1;
      }
    }

    monthlyData = MONTHS.map((m) => ({
      month: m,
      currentYear: buckets[m].current,
      previousYear: buckets[m].previous,
    }));
  }

  /* ── Render ─────────────────────────────────────────────────────────── */

  const displayName = profile?.display_name ?? 'Historian';

  return (
    <div className="px-6 md:px-12 py-12 max-w-7xl">
      {/* Editorial Header */}
      <div className="mb-16">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-4 block">
          Analytical Overview
        </span>
        <h2 className="font-heading text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tight">
          Curatorial Impact
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          Welcome, {displayName}. A comprehensive trace of your contributions to the digital archive.
          {publishedDocs.length > 0 && (
            <> You have {publishedDocs.length} published {publishedDocs.length === 1 ? 'writing' : 'writings'} in the archive.</>
          )}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10 md:mb-16">
        <MetricCard
          label="Total Citations"
          value={totalCitations ?? 0}
          icon={
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          }
        />
        <MetricCard
          label="Published Writings"
          value={publishedDocs.length}
          detail={totalDocs > 0 ? `${totalDocs} total uploaded` : undefined}
          icon={
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          }
        />
        <MetricCard
          label="Pending Peer Reviews"
          value={pendingReviews ?? 0}
          detail={pendingReviews ? 'Awaiting reviewer decisions' : undefined}
          icon={
            <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" strokeWidth={0.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
          }
        />
      </div>

      {/* Citations Over Time Chart */}
      <div className="mb-16">
        <CitationsChart
          data={monthlyData}
          currentYearLabel={`${currentYear} Active`}
          previousYearLabel={`${previousYear} Baseline`}
        />
      </div>

      {/* Top Cited Works */}
      {topCited.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h4 className="font-heading text-xl md:text-2xl font-bold text-foreground">Top Cited Works</h4>
            <Link
              href="/publications"
              className="text-[10px] uppercase tracking-widest text-primary hover:underline underline-offset-4 decoration-2 transition-all"
            >
              View All Publications
            </Link>
          </div>

          {/* Mobile: card layout */}
          <div className="space-y-3 md:hidden">
            {topCited.map((doc) => (
              <div key={doc.id} className="bg-surface-elevated p-4 space-y-3">
                <Link
                  href={`/publications/${doc.id}`}
                  className="font-heading text-base text-foreground hover:text-primary transition-colors block"
                >
                  {doc.title}
                </Link>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-text-muted-vault">
                      {doc.published_at
                        ? new Date(doc.published_at).getFullYear()
                        : new Date().getFullYear()}
                    </span>
                    <span className="font-heading text-lg text-primary font-bold">{doc.citations} <span className="text-xs font-normal text-text-muted-vault">citations</span></span>
                  </div>
                  <StatusBadge status={doc.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="bg-surface-elevated overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-6 px-8 text-[10px] uppercase tracking-widest text-text-muted-vault font-medium">
                      Manuscript Title
                    </th>
                    <th className="py-6 px-8 text-[10px] uppercase tracking-widest text-text-muted-vault font-medium">
                      Year
                    </th>
                    <th className="py-6 px-8 text-[10px] uppercase tracking-widest text-text-muted-vault font-medium">
                      Citations
                    </th>
                    <th className="py-6 px-8 text-[10px] uppercase tracking-widest text-text-muted-vault font-medium text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {topCited.map((doc) => (
                    <tr key={doc.id} className="group hover:bg-muted/40 transition-colors">
                      <td className="py-8 px-8">
                        <div className="flex items-center gap-4">
                          <svg className="w-5 h-5 shrink-0 text-primary/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                          </svg>
                          <Link
                            href={`/publications/${doc.id}`}
                            className="font-heading text-lg text-foreground group-hover:text-primary transition-colors"
                          >
                            {doc.title}
                          </Link>
                        </div>
                      </td>
                      <td className="py-8 px-8 text-sm text-text-muted-vault">
                        {doc.published_at
                          ? new Date(doc.published_at).getFullYear()
                          : new Date().getFullYear()}
                      </td>
                      <td className="py-8 px-8">
                        <span className="font-heading text-xl text-primary font-bold">{doc.citations}</span>
                      </td>
                      <td className="py-8 px-8 text-right">
                        <StatusBadge status={doc.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalDocs === 0 && (
        <div className="bg-surface-elevated py-16 text-center space-y-3">
          <p className="font-heading text-xl text-foreground">No contributions yet</p>
          <p className="text-sm text-muted-foreground">
            Start by{' '}
            <Link href="/upload" className="text-primary hover:underline">
              uploading a manuscript
            </Link>{' '}
            to the archive.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: number;
  detail?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-surface-elevated p-5 sm:p-6 md:p-8 border-t-2 border-primary shadow-sm relative overflow-hidden group hover:border-primary/80 transition-all duration-300">
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-foreground">
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-widest text-text-muted-vault mb-3 md:mb-6">{label}</p>
      <h3 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">
        {value.toLocaleString()}
      </h3>
      {detail && (
        <p className="text-xs text-text-muted-vault/60 font-medium">{detail}</p>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  published:
    'bg-primary/10 border-primary/20 text-primary',
  under_review:
    'bg-amber-500/10 border-amber-500/20 text-amber-400',
  pending:
    'bg-zinc-800/40 border-zinc-700/50 text-zinc-400',
  draft:
    'bg-zinc-800/40 border-zinc-700/50 text-zinc-400',
  rejected:
    'bg-red-500/10 border-red-500/20 text-red-400',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  const label = status === 'published' ? 'Authenticated' : status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-block px-3 py-1 border text-[10px] uppercase tracking-widest font-bold ${style}`}
    >
      {label}
    </span>
  );
}

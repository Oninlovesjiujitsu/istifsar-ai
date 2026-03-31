import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Impact Dashboard — Istifsar' };

export default async function HistorianDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user!.id;

  const [
    { data: profile },
    { data: documents },
    { data: citationCount },
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
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('citations')
      .select('id', { count: 'exact', head: true })
      .in(
        'document_id',
        (await supabase.from('documents').select('id').eq('submitter_id', userId)).data?.map(
          (d) => d.id,
        ) ?? [],
      ),
  ]);

  const firstName = profile?.display_name?.split(' ')[0] ?? 'Historian';
  const totalDocs = documents?.length ?? 0;
  const publishedDocs = documents?.filter((d) => d.status === 'published').length ?? 0;
  const totalCitations = citationCount?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="mt-1 text-muted-foreground">
          Your contributions help build the archive.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Writings uploaded" value={totalDocs} detail={`${publishedDocs} published`} />
        <StatCard label="Times cited" value={totalCitations} />
        <StatCard label="Published" value={publishedDocs} />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          href="/upload"
          title="Upload a manuscript"
          description="Add a new writing to the archive"
        />
        <QuickAction
          href="/review"
          title="Peer review queue"
          description="Review submitted writings"
        />
        <QuickAction
          href="/bounties"
          title="Target bounties"
          description="Unanswered questions in your domain"
        />
      </div>

      {/* Recent uploads */}
      {totalDocs > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Your writings
            </h2>
            <Link href="/publications" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y rounded-lg border bg-card">
            {documents?.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <StatusPill status={doc.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalDocs === 0 && (
        <div className="rounded-lg border bg-muted/20 py-16 text-center space-y-2">
          <p className="text-muted-foreground">You haven&apos;t contributed anything yet.</p>
          <p className="text-sm text-muted-foreground">
            Start by{' '}
            <Link href="/upload" className="text-primary hover:underline">
              uploading a writing
            </Link>{' '}
            to the archive.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {detail && <p className="text-xs text-muted-foreground/70">{detail}</p>}
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border bg-card p-5 space-y-1 hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <p className="font-medium group-hover:text-primary transition-colors">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  under_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[status] ?? STATUS_COLORS.pending}`}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}

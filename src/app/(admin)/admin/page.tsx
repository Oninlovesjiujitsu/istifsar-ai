import { createAdminClient } from '@/src/lib/supabase/admin';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Console — Istifsar' };

async function getStats() {
  const db = createAdminClient();

  const [
    { count: userCount },
    { count: docCount },
    { count: contentionCount },
    { count: gapCount },
    { count: flaggedCount },
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('contentions').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('archive_gaps').select('id', { count: 'exact', head: true }),
    db.from('messages').select('id', { count: 'exact', head: true }).eq('is_hallucination_flagged', true),
  ]);

  return {
    userCount: userCount ?? 0,
    docCount: docCount ?? 0,
    contentionCount: contentionCount ?? 0,
    gapCount: gapCount ?? 0,
    flaggedCount: flaggedCount ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: 'Registered Users', value: stats.userCount, href: '/admin/users' },
    { label: 'Published Sources', value: stats.docCount, href: '/documents' },
    { label: 'Open Contentions', value: stats.contentionCount, href: '/admin/contentions' },
    { label: 'Archive Gaps', value: stats.gapCount, href: '/admin/gaps' },
    { label: 'Flagged Evaluations', value: stats.flaggedCount, href: '/admin/evaluations' },
  ];

  const quickLinks = [
    { label: 'User Directory', description: 'Manage accounts and adjust authorization tiers', href: '/admin/users' },
    { label: 'Historiographical Contentions', description: 'Review, resolve, or dispute flagged scholar contradictions', href: '/admin/contentions' },
    { label: 'Archive Gaps Board', description: 'Unanswered questions driving future source indexing priorities', href: '/admin/gaps' },
    { label: 'Ingestion Queue', description: 'Validate newly submitted historian publications', href: '/contribute/validate' },
    { label: 'RAG Evaluation Hub', description: 'Audit automatically graded responses for hallucination risks', href: '/admin/evaluations' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
          Admin Console
        </h1>
        <p className="mt-1 text-base text-muted-foreground font-serif italic">
          Curate the scholarly record. Guard the Agoncillo Constraint: &ldquo;No Document, No History.&rdquo;
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-md border border-border/80 bg-card p-5 parchment-texture shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-gold/50"
          >
            <p className="text-3xl font-bold font-heading tabular-nums text-foreground group-hover:text-primary transition-colors">
              {card.value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs font-serif text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-heading text-foreground border-l-2 border-gold/60 pl-3">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex flex-col gap-1.5 rounded-md border border-border/80 bg-card p-5 parchment-texture shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-gold/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.label}
                </span>
                <span className="text-xs text-gold-dim opacity-0 group-hover:opacity-100 transition-opacity font-serif">
                  Access &rarr;
                </span>
              </div>
              <span className="text-sm font-serif text-muted-foreground">
                {link.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Dashboard — Istifsar' };

async function getStats() {
  const db = createAdminClient();

  const [
    { count: userCount },
    { count: docCount },
    { count: contentionCount },
    { count: gapCount },
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    db.from('contentions').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('archive_gaps').select('id', { count: 'exact', head: true }),
  ]);

  return {
    userCount: userCount ?? 0,
    docCount: docCount ?? 0,
    contentionCount: contentionCount ?? 0,
    gapCount: gapCount ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: 'Total users', value: stats.userCount, href: '/admin/users' },
    { label: 'Published sources', value: stats.docCount, href: '/documents' },
    { label: 'Open contentions', value: stats.contentionCount, href: '/admin/contentions' },
    { label: 'Unanswered queries', value: stats.gapCount, href: '/admin/gaps' },
  ];

  const quickLinks = [
    { label: 'Manage users', description: 'View all accounts and change tiers', href: '/admin/users' },
    { label: 'Review contentions', description: 'Resolve or dispute flagged contradictions', href: '/admin/contentions' },
    { label: 'Unanswered queries', description: 'Queries the archive couldn\'t answer — guides what to add next', href: '/admin/gaps' },
    { label: 'Ingestion queue', description: 'Documents pending ingestion processing', href: '/contribute/validate' },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Curate the archive. Keep the knowledge honest.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow"
          >
            <p className="text-3xl font-bold tabular-nums">{card.value.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              {card.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col gap-1 rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <span className="font-medium hover:text-primary transition-colors">{link.label} →</span>
              <span className="text-sm text-muted-foreground">{link.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

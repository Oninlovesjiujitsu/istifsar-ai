import { createAdminClient } from '@/lib/supabase/admin';
import ContentionCard from '@/components/admin/ContentionCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contentions — Admin — Istifsar' };

type StatusFilter = 'all' | 'open' | 'resolved' | 'disputed';

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminContentionsPage({ searchParams }: Props) {
  const { status: statusParam } = await searchParams;
  const filter: StatusFilter =
    statusParam === 'open' || statusParam === 'resolved' || statusParam === 'disputed'
      ? statusParam
      : 'all';

  const db = createAdminClient();

  let query = db
    .from('contentions')
    .select('id, title, description, status, document_ids, essay_ids, resolution_notes, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  const { data: contentions } = await query;

  // Resolve all document IDs to titles in one query
  const allDocIds = [...new Set((contentions ?? []).flatMap((c) => c.document_ids))];
  let documentTitles: Record<string, string> = {};

  if (allDocIds.length > 0) {
    const { data: docs } = await db
      .from('documents')
      .select('id, title')
      .in('id', allDocIds);

    documentTitles = Object.fromEntries((docs ?? []).map((d) => [d.id, d.title]));
  }

  const filterLinks: Array<{ label: string; value: StatusFilter }> = [
    { label: 'All', value: 'all' },
    { label: 'Open', value: 'open' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Disputed', value: 'disputed' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contentions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Potential contradictions detected by AI between published sources.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {filterLinks.map((f) => (
          <a
            key={f.value}
            href={f.value === 'all' ? '/admin/contentions' : `/admin/contentions?status=${f.value}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Contention list */}
      {contentions && contentions.length > 0 ? (
        <div className="space-y-4">
          {contentions.map((c) => (
            <ContentionCard
              key={c.id}
              contention={c}
              documentTitles={documentTitles}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/20 py-16 text-center">
          <p className="text-muted-foreground">
            {filter === 'all'
              ? 'No contentions detected yet. They appear automatically when contradictions are found between published sources.'
              : `No ${filter} contentions.`}
          </p>
        </div>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Publications — Istifsar' };

export default async function PublicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: documents } = await supabase
    .from('documents')
    .select('id, title, status, created_at, published_at')
    .eq('submitter_id', user!.id)
    .order('created_at', { ascending: false });

  const published = documents?.filter((d) => d.status === 'published') ?? [];
  const pending = documents?.filter((d) => d.status !== 'published') ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold">My Publications</h1>
        <p className="mt-1 text-muted-foreground">
          {documents?.length ?? 0} total writings
        </p>
      </div>

      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Pending review
          </h2>
          <div className="divide-y rounded-lg border bg-card">
            {pending.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(doc.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {doc.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {published.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Published
          </h2>
          <div className="divide-y rounded-lg border bg-card">
            {published.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/publications/${doc.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors line-clamp-1"
                  >
                    {doc.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Published{' '}
                    {doc.published_at
                      ? new Date(doc.published_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : ''}
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Published
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(!documents || documents.length === 0) && (
        <div className="rounded-lg border bg-muted/20 py-16 text-center space-y-2">
          <p className="text-muted-foreground">No publications yet.</p>
          <p className="text-sm text-muted-foreground">
            <Link href="/upload" className="text-primary hover:underline">
              Upload your first manuscript
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

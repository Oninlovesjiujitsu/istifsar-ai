import { createClient } from '@/src/lib/supabase/server';
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
    <div className="min-h-full p-4 sm:p-6 lg:p-8 xl:p-12 relative">
      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <span className="text-muted-foreground">Workspace</span>
        <span>/</span>
        <span className="text-primary font-medium">My Publications</span>
      </nav>

      <header className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary">
          Scholar Records
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-foreground leading-tight max-w-2xl mt-3 sm:mt-4">
          My Publications
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl text-sm leading-relaxed">
          {documents?.length ?? 0} total writings contributed to the archive.
        </p>
        <div className="h-px w-24 bg-gradient-to-r from-border to-transparent mt-6" />
      </header>

      <div className="max-w-6xl mx-auto space-y-10">
        {pending.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Pending review
            </h2>
            <div className="divide-y divide-border rounded-lg border bg-card shadow-sm">
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
                  <span className="shrink-0 inline-flex items-center rounded-full border border-amber-800/20 bg-amber-800/10 px-2 py-0.5 text-xs font-medium capitalize text-amber-800">
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
            <div className="divide-y divide-border rounded-lg border bg-card shadow-sm">
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
                  <span className="shrink-0 inline-flex items-center rounded-full border border-sage/20 bg-sage/10 px-2 py-0.5 text-xs font-medium text-sage">
                    Published
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {(!documents || documents.length === 0) && (
          <div className="rounded-lg border border-border bg-muted/20 py-16 text-center space-y-2">
            <p className="text-muted-foreground">No publications yet.</p>
            <p className="text-sm text-muted-foreground">
              <Link href="/upload" className="text-primary hover:underline">
                Upload your first manuscript
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

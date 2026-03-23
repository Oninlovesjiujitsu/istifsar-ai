import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import UseLensButton from '@/components/essays/UseLensButton';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: essay } = await supabase
    .from('living_essays')
    .select('title')
    .eq('slug', slug)
    .single();

  return { title: essay ? `${essay.title} — Istifsar` : "Historian's Perspective — Istifsar" };
}

export default async function EssayDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: essay } = await supabase
    .from('living_essays')
    .select(
      'id, title, slug, content, summary, lens_label, published_at, status, related_document_ids, profiles!author_id(display_name)',
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (!essay) notFound();

  const profile = essay.profiles as { display_name: string } | null;

  const formattedDate = essay.published_at
    ? new Date(essay.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  // Fetch related documents
  let relatedDocs: Array<{ id: string; title: string }> = [];
  if (essay.related_document_ids && essay.related_document_ids.length > 0) {
    const { data: docs } = await supabase
      .from('documents')
      .select('id, title')
      .in('id', essay.related_document_ids)
      .eq('status', 'published');
    relatedDocs = docs ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Back link */}
      <Link
        href="/essays"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Historian&apos;s perspectives
      </Link>

      {/* Header */}
      <div className="mt-4 space-y-4">
        {essay.lens_label && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Historian&apos;s perspective:</span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {essay.lens_label}
            </span>
          </div>
        )}

        <h1 className="text-3xl font-bold leading-tight">{essay.title}</h1>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {profile?.display_name && <span>{profile.display_name}</span>}
          {formattedDate && (
            <>
              <span>·</span>
              <span>{formattedDate}</span>
            </>
          )}
        </div>

        {essay.summary && (
          <p className="text-muted-foreground leading-relaxed italic border-l-2 border-primary/30 pl-4">
            {essay.summary}
          </p>
        )}
      </div>

      {/* Essay content */}
      <div className="mt-8 rounded-lg border bg-muted/20 p-6">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
          {essay.content}
        </pre>
      </div>

      {/* Related documents */}
      {relatedDocs.length > 0 && (
        <div className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Related primary sources
          </h2>
          <ul className="divide-y divide-border rounded-lg border">
            {relatedDocs.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">{doc.title}</span>
                  <span className="text-xs text-primary">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Use as Lens CTA */}
      <div className="mt-10 rounded-lg border bg-primary/5 p-6 space-y-3">
        <h2 className="font-semibold">Explore history through this lens</h2>
        <p className="text-sm text-muted-foreground">
          Start a conversation that uses this historian&apos;s perspective to interpret primary
          sources.
        </p>
        <UseLensButton essayId={essay.id} />
      </div>
    </div>
  );
}

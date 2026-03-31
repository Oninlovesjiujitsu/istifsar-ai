import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from('documents')
    .select('title')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  return { title: doc ? `${doc.title} — Istifsar` : 'Document — Istifsar' };
}

export default async function DocumentDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from('documents')
    .select(
      'id, title, description, document_type, date_of_origin, origin_location, language, status, published_at, storage_path, mime_type, document_tags(tag_id, tags(name, slug))',
    )
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (!doc) notFound();

  // Signed URL for document scan
  let signedUrl: string | null = null;
  if (doc.storage_path) {
    const { data: signed } = await supabase.storage
      .from('document-scans')
      .createSignedUrl(doc.storage_path, 3600);
    signedUrl = signed?.signedUrl ?? null;
  }

  // Transcription path (added in migration 0006 — use type assertion)
  const transcriptionPath = (doc as Record<string, unknown>).transcription_path as string | null ?? null;
  let transcriptionText: string | null = null;
  if (transcriptionPath) {
    const { data: transcriptionSigned } = await supabase.storage
      .from('transcriptions')
      .createSignedUrl(transcriptionPath, 3600);

    if (transcriptionSigned?.signedUrl) {
      try {
        const res = await fetch(transcriptionSigned.signedUrl);
        if (res.ok) transcriptionText = await res.text();
      } catch {
        // ignore
      }
    }
  }

  const tags = (doc.document_tags ?? []).flatMap((dt) => {
    const t = dt.tags as { name: string; slug: string } | null;
    return t ? [t] : [];
  });

  const isPDF = doc.mime_type?.includes('pdf');

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Back link */}
      <Link
        href="/documents"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Primary sources
      </Link>

      {/* Title */}
      <h1 className="mt-4 text-3xl font-bold leading-tight">{doc.title}</h1>

      {/* Metadata bar */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        {doc.document_type && (
          <span className="rounded bg-muted px-2 py-0.5 font-medium capitalize">
            {doc.document_type.replace(/_/g, ' ')}
          </span>
        )}
        {doc.date_of_origin && (
          <span className="text-muted-foreground">{doc.date_of_origin}</span>
        )}
        {doc.origin_location && (
          <span className="text-muted-foreground">{doc.origin_location}</span>
        )}
        {doc.language && (
          <span className="text-muted-foreground capitalize">{doc.language}</span>
        )}
        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Verified
        </span>
      </div>

      {/* Description */}
      {doc.description && (
        <p className="mt-6 text-muted-foreground leading-relaxed">{doc.description}</p>
      )}

      {/* Two-column layout */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Left: Document scan */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Document scan
          </h2>
          <div className="rounded-lg border bg-muted/30 overflow-hidden min-h-[400px] flex items-center justify-center">
            {signedUrl ? (
              isPDF ? (
                <iframe
                  src={signedUrl}
                  title={doc.title}
                  className="w-full h-[600px]"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signedUrl}
                  alt={doc.title}
                  className="max-w-full max-h-[600px] object-contain"
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground p-8 text-center">
                No scan on file for this source.
              </p>
            )}
          </div>
        </div>

        {/* Right: Transcription */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Transcription
          </h2>
          <div className="rounded-lg border bg-muted/30 min-h-[400px] max-h-[600px] overflow-y-auto p-4">
            {transcriptionText ? (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                {transcriptionText}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">No transcription on file for this source.</p>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-8 space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/documents?tag=${tag.slug}`}
                className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-10 rounded-lg border bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="font-semibold">Have questions about this source?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start a conversation grounded in verified primary sources.
          </p>
        </div>
        <Link
          href="/explore"
          className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Ask about this source
        </Link>
      </div>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DocumentCard from '@/components/document/DocumentCard';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Primary Sources — Istifsar' };

type SearchParams = { tag?: string; q?: string };

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { tag: tagSlug, q } = await searchParams;

  const supabase = await createClient();

  // Fetch all tags with counts
  const { data: allTags } = await supabase
    .from('tags')
    .select('id, name, slug, document_tags(count)')
    .order('name');

  const tagsWithCount = (allTags ?? []).filter(
    (t) => Array.isArray(t.document_tags) && (t.document_tags[0] as { count: number })?.count > 0,
  );

  // Build document query
  let query = supabase
    .from('documents')
    .select(
      'id, title, description, document_type, date_of_origin, origin_location, language, published_at, document_tags(tag_id, tags(name, slug))',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (q) {
    query = query.textSearch('fts', q);
  }

  let filteredByTag = false;
  if (tagSlug) {
    const { data: tag } = await supabase
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .single();

    if (tag) {
      filteredByTag = true;
      const { data: taggedDocIds } = await supabase
        .from('document_tags')
        .select('document_id')
        .eq('tag_id', tag.id);

      const ids = (taggedDocIds ?? []).map((r) => r.document_id);
      if (ids.length > 0) {
        query = query.in('id', ids);
      } else {
        // No documents with this tag
        return (
          <div className="mx-auto max-w-7xl px-4 py-10">
            <EmptyState tagSlug={tagSlug} q={q} />
          </div>
        );
      }
    }
  }

  const { data: documents } = await query;
  const docs = documents ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Primary sources</h1>
          {docs.length > 0 && (
            <span className="rounded-full bg-muted px-3 py-0.5 text-sm font-medium text-muted-foreground">
              {docs.length}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">
          Verified primary sources from the historical archive.
        </p>
      </div>

      {/* Search result banner */}
      {q && (
        <div className="mb-6 flex items-center gap-3 rounded-md border bg-muted/40 px-4 py-2.5 text-sm">
          <span>
            Showing results for <strong>&ldquo;{q}&rdquo;</strong>
          </span>
          <Link href="/documents" className="ml-auto text-primary hover:underline">
            Clear search
          </Link>
        </div>
      )}

      {/* Tag filter row */}
      {tagsWithCount.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/documents"
            className={[
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              !tagSlug
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            ].join(' ')}
          >
            All
          </Link>
          {tagsWithCount.map((tag) => (
            <Link
              key={tag.slug}
              href={`/documents?tag=${tag.slug}`}
              className={[
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                tagSlug === tag.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Document grid */}
      {docs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => {
            const tags = (doc.document_tags ?? []).flatMap((dt) => {
              const t = dt.tags as { name: string; slug: string } | null;
              return t ? [t] : [];
            });

            return (
              <DocumentCard
                key={doc.id}
                id={doc.id}
                title={doc.title}
                description={doc.description}
                documentType={doc.document_type}
                dateOfOrigin={doc.date_of_origin}
                originLocation={doc.origin_location}
                language={doc.language}
                publishedAt={doc.published_at}
                tags={tags}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState tagSlug={filteredByTag ? tagSlug : undefined} q={q} />
      )}
    </div>
  );
}

function EmptyState({ tagSlug, q }: { tagSlug?: string; q?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-muted-foreground">No sources found.</p>
      {(tagSlug || q) && (
        <Link
          href="/documents"
          className="text-sm text-primary hover:underline"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

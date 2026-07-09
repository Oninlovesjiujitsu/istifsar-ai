import { createClient } from '@/src/lib/supabase/server';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Source Network — Istifsar' };

type TagWithDocs = {
  id: string;
  name: string;
  slug: string;
  publishedCount: number;
  sampleTitles: string[];
};

export default async function NetworkPage() {
  const supabase = await createClient();

  // Fetch tags with their document associations
  const { data: tagRows } = await supabase
    .from('tags')
    .select('id, name, slug')
    .order('name');

  if (!tagRows?.length) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
        <h1 className="text-3xl font-bold">Source network</h1>
        <div className="rounded-lg border bg-muted/20 py-16 text-center">
          <p className="text-muted-foreground">
            The archive is growing. Topics will appear here as sources are added.
          </p>
        </div>
      </div>
    );
  }

  // Fetch document_tags with document status for all tags in one query
  const tagIds = tagRows.map((t) => t.id);
  const { data: tagDocRows } = await supabase
    .from('document_tags')
    .select('tag_id, document_id, documents(id, title, status)')
    .in('tag_id', tagIds);

  // Build tag metadata
  const tagMap: Record<string, TagWithDocs> = {};
  for (const t of tagRows) {
    tagMap[t.id] = { id: t.id, name: t.name, slug: t.slug, publishedCount: 0, sampleTitles: [] };
  }

  for (const row of tagDocRows ?? []) {
    const doc = row.documents as { id: string; title: string; status: string } | null;
    if (!doc || doc.status !== 'published') continue;
    const tag = tagMap[row.tag_id];
    if (!tag) continue;
    tag.publishedCount += 1;
    if (tag.sampleTitles.length < 3) {
      tag.sampleTitles.push(doc.title);
    }
  }

  const tagsWithDocs = Object.values(tagMap)
    .filter((t) => t.publishedCount > 0)
    .sort((a, b) => b.publishedCount - a.publishedCount);

  const maxCount = tagsWithDocs[0]?.publishedCount ?? 1;

  // Tags with 3+ docs get a collection card
  const collectionTags = tagsWithDocs.filter((t) => t.publishedCount >= 3);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-14">
      {/* Hero */}
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">Source network</h1>
        <p className="text-muted-foreground text-lg">
          Explore the archive by topic. Bigger chips mean more sources.
        </p>
      </section>

      {/* Tag cloud */}
      {tagsWithDocs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Browse by topic
          </h2>
          <div className="flex flex-wrap gap-2">
            {tagsWithDocs.map((tag) => {
              const ratio = tag.publishedCount / maxCount;
              const sizeClass =
                ratio > 0.7
                  ? 'text-xl px-4 py-2'
                  : ratio > 0.4
                    ? 'text-base px-3 py-1.5'
                    : 'text-sm px-3 py-1';
              return (
                <Link
                  key={tag.id}
                  href={`/documents?tag=${tag.slug}`}
                  className={`inline-flex items-center gap-1.5 rounded-full border bg-card font-medium hover:border-primary/40 hover:bg-muted/50 hover:text-primary transition-colors ${sizeClass}`}
                >
                  {tag.name}
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {tag.publishedCount}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Collections grid */}
      {collectionTags.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Collections by topic
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collectionTags.map((tag) => (
              <div key={tag.id} className="rounded-lg border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{tag.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {tag.publishedCount} source{tag.publishedCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {tag.sampleTitles.map((title) => (
                    <li
                      key={title}
                      className="text-sm text-muted-foreground line-clamp-1 before:mr-1.5 before:text-border before:content-['–']"
                    >
                      {title}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/documents?tag=${tag.slug}`}
                  className="inline-block text-sm text-primary hover:underline"
                >
                  Browse {tag.name} →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {tagsWithDocs.length === 0 && (
        <div className="rounded-lg border bg-muted/20 py-16 text-center">
          <p className="text-muted-foreground">
            The archive is growing. Topics will appear here as tagged sources are added.
          </p>
        </div>
      )}
    </div>
  );
}

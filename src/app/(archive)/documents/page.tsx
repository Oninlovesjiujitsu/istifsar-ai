import { createClient } from '@/src/lib/supabase/server';
import ArchiveCard from '@/src/features/archive/components/ArchiveCard';
import DiscoveryTip from '@/src/features/explore/components/DiscoveryTip';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Archive — Istifsar AI' };

export default async function DocumentsPage() {
  const supabase = await createClient();

  // Fetch tags with their document counts
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .order('name');

  // Get document counts per tag
  const tagIds = (tags ?? []).map((t) => t.id);
  const { data: tagCounts } = tagIds.length
    ? await supabase
        .from('document_tags')
        .select('tag_id')
        .in('tag_id', tagIds)
    : { data: [] };

  // Build count map
  const countMap = new Map<string, number>();
  for (const row of tagCounts ?? []) {
    countMap.set(row.tag_id, (countMap.get(row.tag_id) ?? 0) + 1);
  }

  // Fetch total published document count
  const { count: totalDocs } = await supabase
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');

  // Sort tags by document count (most popular first)
  const sortedTags = (tags ?? []).sort(
    (a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0),
  );

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 xl:p-12 relative">
      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <span className="text-primary font-medium">Archive</span>
      </nav>

      {/* Editorial Header */}
      <header className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <div className="flex flex-col gap-2 sm:gap-3">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {(totalDocs ?? 0).toLocaleString()} writings in the archive
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-foreground leading-tight max-w-2xl">
            Historical Collections
          </h2>
          <div className="h-px w-20 bg-gradient-to-r from-border to-transparent mt-3" />
        </div>
      </header>

      {/* Archive Cards — Bento Grid */}
      <section className="max-w-6xl mx-auto">
        {sortedTags.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {sortedTags.map((tag) => (
              <ArchiveCard
                key={tag.id}
                href={`/documents/${tag.slug}`}
                title={tag.name}
                description={tag.description ?? `Explore writings tagged with ${tag.name}.`}
                stat={`${(countMap.get(tag.id) ?? 0).toLocaleString()} writings`}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <ArchiveCard
              href="/documents/all"
              title="Browse All Writings"
              description="Explore the full collection of historian-authored works in the archive."
              stat={`${(totalDocs ?? 0).toLocaleString()} writings`}
            />
          </div>
        )}
      </section>

      {/* Discovery Tip */}
      <section className="max-w-6xl mx-auto mt-24 lg:mt-32 mb-8 lg:mb-12">
        <DiscoveryTip />
      </section>
    </div>
  );
}

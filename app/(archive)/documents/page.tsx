import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import DocumentCard from '@/components/document/DocumentCard';
import Link from 'next/link';
import type { Metadata } from 'next';

type Props = {
  searchParams: Promise<{ tag?: string }>;
};

export const metadata: Metadata = { title: 'Writings — Istifsar AI' };

export default async function DocumentsPage({ searchParams }: Props) {
  await proxy({ requireAuth: true });

  const { tag: tagSlug } = await searchParams;
  const supabase = await createClient();

  // Look up active tag if filtered
  let activeTag: { id: string; name: string; slug: string } | null = null;
  if (tagSlug) {
    const { data } = await supabase
      .from('tags')
      .select('id, name, slug')
      .eq('slug', tagSlug)
      .single();
    activeTag = data;
  }

  // Fetch published documents with their tags
  const { data: docs } = await supabase
    .from('documents')
    .select(
      'id, title, description, document_type, date_of_origin, origin_location, language, published_at, document_tags(tag_id, tags(name, slug))',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false });

  // Filter by tag if needed
  let filteredDocs = docs ?? [];
  if (activeTag) {
    filteredDocs = filteredDocs.filter((doc) =>
      (doc.document_tags ?? []).some((dt) => {
        const t = dt.tags as { name: string; slug: string } | null;
        return t?.slug === tagSlug;
      }),
    );
  }

  // Fetch all tags for filter pills
  const { data: allTags } = await supabase
    .from('tags')
    .select('id, name, slug')
    .order('name');

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-16 xl:p-24 relative">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-10 sm:mb-16 mt-4 sm:mt-8 lg:mt-12">
        <div className="flex flex-col gap-3 sm:gap-4">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-gold/60">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'writing' : 'writings'}
            {activeTag ? ` in ${activeTag.name}` : ' in the archive'}
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-6xl font-heading text-gold leading-tight max-w-2xl">
            {activeTag ? activeTag.name : 'Published Writings'}
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-gold to-transparent mt-4" />
        </div>
      </header>

      {/* Tag filter pills */}
      {(allTags?.length ?? 0) > 0 && (
        <section className="max-w-6xl mx-auto mb-8">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/documents"
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                !activeTag
                  ? 'bg-gold text-[#241a00] font-medium'
                  : 'bg-surface-elevated text-text-muted-vault hover:bg-white/10'
              }`}
            >
              All
            </Link>
            {(allTags ?? []).map((t) => (
              <Link
                key={t.slug}
                href={`/documents?tag=${t.slug}`}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                  activeTag?.slug === t.slug
                    ? 'bg-gold text-[#241a00] font-medium'
                    : 'bg-surface-elevated text-text-muted-vault hover:bg-white/10'
                }`}
              >
                {t.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Document grid */}
      <section className="max-w-6xl mx-auto">
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => {
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
          <div className="text-center py-20">
            <p className="text-text-muted-vault text-lg">
              No writings found{activeTag ? ` for "${activeTag.name}"` : ''}.
            </p>
            {activeTag && (
              <Link
                href="/documents"
                className="text-gold hover:underline mt-2 inline-block text-sm"
              >
                View all writings
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

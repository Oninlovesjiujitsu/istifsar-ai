import { createClient } from '@/src/lib/supabase/server';
import DocumentCard from '@/src/features/documents/components/DocumentCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ tagSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tagSlug } = await params;
  const supabase = await createClient();
  const { data: tag } = await supabase
    .from('tags')
    .select('name')
    .eq('slug', tagSlug)
    .single();

  return { title: tag ? `${tag.name} Archives — Istifsar AI` : 'Archive — Istifsar AI' };
}

export default async function TagDocumentsPage({ params }: Props) {
  const { tagSlug } = await params;
  const supabase = await createClient();

  // Fetch the active tag
  const { data: activeTag } = await supabase
    .from('tags')
    .select('id, name, slug, description')
    .eq('slug', tagSlug)
    .single();

  if (!activeTag) {
    notFound();
  }

  // Fetch document IDs associated with this tag
  const { data: docRelations } = await supabase
    .from('document_tags')
    .select('document_id')
    .eq('tag_id', activeTag.id);

  const docIds = (docRelations ?? []).map((r) => r.document_id);

  let filteredDocs: any[] = [];
  if (docIds.length > 0) {
    const { data: docs } = await supabase
      .from('documents')
      .select(
        'id, title, description, document_type, date_of_origin, origin_location, language, published_at, document_tags(tag_id, tags(name, slug))',
      )
      .in('id', docIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false });
    filteredDocs = docs ?? [];
  }

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 xl:p-12 relative">
      {/* Dynamic Breadcrumbs */}
      <nav className="max-w-6xl mx-auto mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <Link href="/documents" className="hover:text-gold transition-colors">
          Archive
        </Link>
        <span className="text-zinc-600">/</span>
        <span className="text-gold font-medium">{activeTag.name}</span>
      </nav>

      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <div className="flex flex-col gap-2 sm:gap-3">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gold/60">
            {filteredDocs.length} {filteredDocs.length === 1 ? 'writing' : 'writings'} in collection
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-gold leading-tight max-w-2xl">
            {activeTag.name}
          </h2>
          {activeTag.description && (
            <p className="text-muted-foreground text-sm max-w-2xl mt-1.5 leading-relaxed">
              {activeTag.description}
            </p>
          )}
          <div className="h-px w-20 bg-gradient-to-r from-gold to-transparent mt-3" />
        </div>
      </header>

      {/* Document grid */}
      <section className="max-w-6xl mx-auto">
        {filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => {
              const tags = (doc.document_tags ?? []).flatMap((dt: any) => {
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
          <div className="text-center py-20 border border-dashed border-border rounded-sm">
            <p className="text-text-muted-vault text-lg">
              No writings found in the {activeTag.name} collection yet.
            </p>
            <Link
              href="/documents"
              className="text-gold hover:underline mt-4 inline-block text-sm"
            >
              Browse other collections
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

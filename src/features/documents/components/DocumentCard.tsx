import Link from 'next/link';
import AskAboutButton from './AskAboutButton';

type Props = {
  id: string;
  title: string;
  description: string | null;
  documentType: string | null;
  dateOfOrigin: string | null;
  originLocation: string | null;
  language: string | null;
  publishedAt: string | null;
  tags: Array<{ name: string; slug: string }>;
};

export default function DocumentCard({
  id,
  title,
  description,
  documentType,
  dateOfOrigin,
  publishedAt,
  tags,
}: Props) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="rounded-lg border bg-card transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-md hover:border-gold/30 dark:hover:border-gold/40 flex flex-col h-full">
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Tag chips */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/documents/${tag.slug}`}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <Link href={`/documents/${tags[0]?.slug ?? 'all'}/${id}`} className="group">
          <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
        </Link>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 px-5 pb-4 pt-2 border-t mt-auto">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {documentType && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-medium capitalize">
              {documentType.replace(/_/g, ' ')}
            </span>
          )}
          {dateOfOrigin && <span>{dateOfOrigin}</span>}
          {!dateOfOrigin && formattedDate && <span>{formattedDate}</span>}
        </div>
        <AskAboutButton documentId={id} />
      </div>
    </div>
  );
}

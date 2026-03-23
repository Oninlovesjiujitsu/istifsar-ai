import Link from 'next/link';

type Props = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  lensLabel: string | null;
  authorName: string;
  publishedAt: string | null;
};

export default function EssayCard({
  title,
  slug,
  summary,
  lensLabel,
  authorName,
  publishedAt,
}: Props) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <Link href={`/essays/${slug}`} className="group block">
      <div className="rounded-lg border bg-card hover:shadow-sm transition-shadow p-5 h-full flex flex-col gap-3">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
            {title}
          </h3>
          {lensLabel && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {lensLabel}
            </span>
          )}
        </div>

        {summary && (
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{summary}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-auto pt-1">
          <span>{authorName}</span>
          {formattedDate && (
            <>
              <span>·</span>
              <span>{formattedDate}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

import Link from 'next/link';

type Props = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  authorName: string;
  publishedAt: string | null;
  nodeCount?: number;
};

export default function PathCard({
  title,
  slug,
  description,
  authorName,
  publishedAt,
  nodeCount,
}: Props) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <Link href={`/paths/${slug}`} className="group block">
      <div className="rounded-lg border bg-card transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-md hover:border-gold/30 dark:hover:border-gold/40 p-5 h-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          {nodeCount !== undefined && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {nodeCount} {nodeCount === 1 ? 'stop' : 'stops'}
            </span>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{description}</p>
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

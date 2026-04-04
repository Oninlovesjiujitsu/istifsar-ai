import Link from 'next/link';

type ContentionRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  document_ids: string[];
  resolution_notes: string | null;
  created_at: string;
};

type Props = {
  contention: ContentionRow;
  documentTitles: Record<string, string>;
  /** Base path for document links. Defaults to '/documents'. Use '/publications' in workspace. */
  documentBasePath?: string;
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  disputed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

/**
 * Read-only contention display card for public document pages.
 * Shows contention title, description, linked sources, and status.
 */
export default function ContentionView({ contention, documentTitles, documentBasePath = '/documents' }: Props) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm truncate">{contention.title}</h4>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_BADGE[contention.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {contention.status}
            </span>
          </div>
          {contention.description && (
            <p className="text-sm text-muted-foreground">{contention.description}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(contention.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {contention.document_ids.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            Sources in conflict
          </p>
          <ul className="space-y-0.5">
            {contention.document_ids.map((docId) => (
              <li key={docId} className="text-sm">
                {documentTitles[docId] ? (
                  <Link
                    href={`${documentBasePath}/${docId}`}
                    className="text-primary hover:underline"
                  >
                    {documentTitles[docId]}
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{docId}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {contention.resolution_notes && contention.status !== 'open' && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">Resolution: </span>
          {contention.resolution_notes}
        </div>
      )}
    </div>
  );
}

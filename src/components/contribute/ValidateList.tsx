import Link from 'next/link';

type Props = {
  documents: Array<{
    id: string;
    title: string;
    document_type: string | null;
    date_of_origin: string | null;
    created_at: string;
    status: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profiles: any;
    document_validations: Array<{ decision: string; validator_id: string }>;
  }>;
  userId: string;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };
  const labels: Record<string, string> = {
    pending: 'Pending',
    under_review: 'Under review',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? 'bg-gray-100 text-gray-700'
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}

export default function ValidateList({ documents, userId }: Props) {
  if (documents.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No documents are currently awaiting review.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border">
      {documents.map((doc) => {
        const validations = doc.document_validations ?? [];
        const approvals = validations.filter((v) => v.decision === 'approved').length;
        const flags = validations.filter((v) => v.decision === 'flagged').length;
        const alreadyReviewed = validations.some((v) => v.validator_id === userId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const submitterName = (doc.profiles as any)?.display_name ?? 'Unknown contributor';

        return (
          <li key={doc.id} className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0 flex-1 space-y-1">
              {/* Title */}
              <Link
                href={`/contribute/validate/${doc.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {doc.title}
              </Link>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {doc.document_type && (
                  <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    {doc.document_type}
                  </span>
                )}
                <span>Submitted by {submitterName}</span>
                <span>{formatDate(doc.created_at)}</span>
              </div>

              {/* Status + validation summary */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <StatusBadge status={doc.status} />
                <span className="text-xs text-muted-foreground">
                  {approvals} approval{approvals !== 1 ? 's' : ''} · {flags} flag
                  {flags !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Right side action / reviewed badge */}
            <div className="shrink-0 pt-1">
              {alreadyReviewed ? (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Reviewed
                </span>
              ) : (
                <Link
                  href={`/contribute/validate/${doc.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Review
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

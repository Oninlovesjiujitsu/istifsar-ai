'use client';

import { useTransition, useState } from 'react';
import { resolveContention } from '@/src/features/admin/actions/admin';
import { Button } from '@/src/components/ui/button';

type ContentionRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  document_ids: string[];
  essay_ids: string[];
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  contention: ContentionRow;
  documentTitles: Record<string, string>;
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-amber-800/10 border border-amber-800/20 text-amber-800',
  resolved: 'bg-sage/10 border border-sage/20 text-sage',
  disputed: 'bg-red-800/10 border border-red-800/20 text-red-800',
};

export default function ContentionCard({ contention, documentTitles }: Props) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isOpen = contention.status === 'open';

  function handleAction(newStatus: 'resolved' | 'disputed') {
    setError(null);
    startTransition(async () => {
      try {
        await resolveContention(contention.id, notes, newStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{contention.title}</h3>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[contention.status] ?? 'bg-gray-100 text-gray-600'}`}
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

      {/* Linked documents */}
      {contention.document_ids.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Linked sources
          </p>
          <ul className="space-y-1">
            {contention.document_ids.map((docId) => (
              <li key={docId} className="text-sm">
                {documentTitles[docId] ? (
                  <a
                    href={`/documents/all/${docId}`}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {documentTitles[docId]}
                  </a>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{docId}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resolution notes (existing) */}
      {contention.resolution_notes && !isOpen && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">Resolution notes: </span>
          {contention.resolution_notes}
        </div>
      )}

      {/* Action form — only for open contentions */}
      {isOpen && (
        <div className="space-y-3 border-t pt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add resolution notes (optional)…"
            rows={2}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isPending}
          />
          {error && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('resolved')}
              disabled={isPending}
              className="border-sage/30 text-sage hover:bg-sage/5"
            >
              {isPending ? 'Saving…' : 'Mark resolved'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('disputed')}
              disabled={isPending}
              className="border-red-800/30 text-red-800 hover:bg-red-800/5"
            >
              {isPending ? 'Saving…' : 'Mark disputed'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

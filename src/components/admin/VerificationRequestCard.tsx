'use client';

import { useTransition, useState } from 'react';
import { reviewVerificationRequest } from '@/src/actions/verification';
import { Button } from '@/src/components/ui/button';
import { ROLE_BADGE, ROLE_LABELS } from '@/src/lib/ui/role-labels';

type VerificationRow = {
  id: string;
  link_type: string;
  link_url: string;
  status: string;
  reviewer_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  user: {
    display_name: string;
    username: string;
    role: string;
  };
  reviewer: {
    display_name: string;
  } | null;
};

type Props = {
  request: VerificationRow;
};

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
};

const LINK_TYPE_LABELS: Record<string, string> = {
  google_scholar: 'Google Scholar Profile',
  faculty_page: 'University Faculty Page',
  doi: 'Published Paper (DOI)',
};

export default function VerificationRequestCard({ request }: Props) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isOpen = request.status === 'pending';

  function handleAction(decision: 'approved' | 'denied') {
    setError(null);
    startTransition(async () => {
      try {
        await reviewVerificationRequest(request.id, decision, notes);
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
            <h3 className="font-semibold">{request.user.display_name}</h3>
            <span className="text-sm text-muted-foreground">@{request.user.username}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[request.user.role] ?? ROLE_BADGE.reader}`}
            >
              {ROLE_LABELS[request.user.role] ?? request.user.role}
            </span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[request.status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {request.status}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(request.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Verification link */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {LINK_TYPE_LABELS[request.link_type] ?? request.link_type}
        </p>
        <a
          href={request.link_url}
          className="text-sm text-primary hover:underline break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          {request.link_url}
        </a>
      </div>

      {/* Reviewer notes (existing) */}
      {request.reviewer_notes && !isOpen && (
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="font-medium">
            {request.status === 'approved' ? 'Approval' : 'Denial'} notes
            {request.reviewer ? ` (${request.reviewer.display_name})` : ''}:{' '}
          </span>
          {request.reviewer_notes}
        </div>
      )}

      {/* Action form — only for pending requests */}
      {isOpen && (
        <div className="space-y-3 border-t pt-4">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add review notes (optional)…"
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
              onClick={() => handleAction('approved')}
              disabled={isPending}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {isPending ? 'Saving…' : 'Approve — grant Verified Historian'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('denied')}
              disabled={isPending}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {isPending ? 'Saving…' : 'Deny'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

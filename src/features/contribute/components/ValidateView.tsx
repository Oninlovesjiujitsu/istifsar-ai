'use client';

import { useActionState, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { validateDocument } from '@/src/features/documents/actions/validate-document';
import type { ValidateResult } from '@/src/features/documents/actions/validate-document';

type Props = {
  documentId: string;
  title: string;
  description: string | null;
  documentType: string | null;
  dateOfOrigin: string | null;
  originLocation: string | null;
  language: string | null;
  mimeType: string | null;
  scanUrl: string | null;
  transcriptionText: string | null;
  existingValidation: { decision: string; notes: string | null } | null;
  validations: Array<{ validatorName: string; decision: string; notes: string | null }>;
};

const DECISION_LABELS: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  flagged: 'Flagged for review',
};

const DECISION_BADGE_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  flagged: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function ValidateView({
  documentId,
  title,
  description,
  documentType,
  dateOfOrigin,
  originLocation,
  language,
  mimeType,
  scanUrl,
  transcriptionText,
  existingValidation,
  validations,
}: Props) {
  const [state, formAction, isPending] = useActionState<ValidateResult | null, FormData>(
    validateDocument,
    null,
  );
  const [pendingDecision, setPendingDecision] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* ── Document metadata bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        <h1 className="w-full text-lg font-semibold">{title}</h1>
        {documentType && (
          <span>
            <span className="text-muted-foreground">Type: </span>
            {documentType}
          </span>
        )}
        {dateOfOrigin && (
          <span>
            <span className="text-muted-foreground">Date: </span>
            {dateOfOrigin}
          </span>
        )}
        {originLocation && (
          <span>
            <span className="text-muted-foreground">Location: </span>
            {originLocation}
          </span>
        )}
        {language && (
          <span>
            <span className="text-muted-foreground">Language: </span>
            {language}
          </span>
        )}
        {description && (
          <p className="w-full text-muted-foreground">{description}</p>
        )}
      </div>

      {/* ── Two-column content grid ────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Document scan */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Document scan</h2>
          {scanUrl ? (
            mimeType === 'application/pdf' ? (
              <div className="space-y-2">
                <iframe
                  src={scanUrl}
                  title="Document scan"
                  className="w-full rounded border"
                  style={{ minHeight: '600px' }}
                />
                <a
                  href={scanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Open PDF in new tab
                </a>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={scanUrl}
                alt="Document scan"
                className="w-full rounded border object-contain"
              />
            )
          ) : (
            <div className="flex min-h-40 items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
              Scan not available
            </div>
          )}
        </div>

        {/* Right: Transcription */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Transcription</h2>
          {transcriptionText ? (
            <div
              className="max-h-[500px] overflow-y-auto rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap"
            >
              {transcriptionText}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No transcription available — review the document scan directly.
            </p>
          )}
        </div>
      </div>

      {/* ── Validation section ─────────────────────────────────────────── */}
      <div className="space-y-4 rounded-lg border p-5">
        <h2 className="text-base font-semibold">Your decision</h2>

        {existingValidation ? (
          /* Read-only banner for already-reviewed documents */
          <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">You decided:</span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${DECISION_BADGE_STYLES[existingValidation.decision] ?? ''
                  }`}
              >
                {DECISION_LABELS[existingValidation.decision] ?? existingValidation.decision}
              </span>
            </div>
            {existingValidation.notes && (
              <p className="text-sm text-muted-foreground">{existingValidation.notes}</p>
            )}
          </div>
        ) : (
          /* Validation form */
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="document_id" value={documentId} />

            {/* Error message */}
            {state && !state.success && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            {/* Notes textarea */}
            <div>
              <label htmlFor="validate-notes" className="mb-1.5 block text-sm font-medium">
                Notes{' '}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <textarea
                id="validate-notes"
                name="notes"
                rows={3}
                placeholder="Add notes (optional)..."
                disabled={isPending}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
            </div>

            {/* Decision buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="decision"
                value="approved"
                disabled={isPending}
                onClick={() => setPendingDecision('approved')}
                className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending && pendingDecision === 'approved' ? 'Saving…' : 'Approve'}
              </button>

              <button
                type="submit"
                name="decision"
                value="rejected"
                disabled={isPending}
                onClick={() => setPendingDecision('rejected')}
                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending && pendingDecision === 'rejected' ? 'Saving…' : 'Reject'}
              </button>

              <button
                type="submit"
                name="decision"
                value="flagged"
                disabled={isPending}
                onClick={() => setPendingDecision('flagged')}
                className="inline-flex items-center justify-center rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending && pendingDecision === 'flagged' ? 'Saving…' : 'Flag for review'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Prior validator decisions ──────────────────────────────────── */}
      {validations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Other validator decisions</h2>
          <ul className="divide-y divide-border rounded-lg border">
            {validations.map((v, i) => (
              <li key={i} className="flex items-start gap-4 px-4 py-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{v.validatorName}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${DECISION_BADGE_STYLES[v.decision] ?? 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {DECISION_LABELS[v.decision] ?? v.decision}
                    </span>
                  </div>
                  {v.notes && (
                    <p className="text-sm text-muted-foreground">{v.notes}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

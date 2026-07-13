
'use client';

import { useActionState, useRef, useState } from 'react';
import { uploadDocument } from '@/src/features/documents/actions/upload-document';
import { Button } from '@/src/components/ui/button';
import TagSelector, { type TagOption } from '@/src/features/contribute/components/TagSelector';
import type { UploadDocumentResult } from '@/src/features/documents/types';

const DOCUMENT_TYPES = [
  { value: 'manuscript', label: 'Manuscript' },
  { value: 'photograph', label: 'Photograph' },
  { value: 'newspaper', label: 'Newspaper' },
  { value: 'official_record', label: 'Official Record' },
  { value: 'map', label: 'Map' },
  { value: 'other', label: 'Other' },
];

const MAX_SCAN_BYTES = 52_428_800;
const MAX_TRANS_BYTES = 10_485_760;

export default function UploadForm() {
  const [state, formAction, isPending] = useActionState<
    UploadDocumentResult | null,
    FormData
  >(uploadDocument, null);

  const formRef = useRef<HTMLFormElement>(null);
  const [selectedTags, setSelectedTags] = useState<TagOption[]>([]);

  // Success state
  if (state?.success) {
    return (
      <div className="rounded-xl border border-sage/20 bg-card p-6 text-center shadow-sm">
        <p className="font-semibold text-sage">
          Source submitted
        </p>
        <p className="mt-1 text-sm text-sage/90">
          Your document is being processed. It will appear in the validation
          queue once text extraction and indexing are complete.
        </p>
        <p className="mt-3 font-mono text-xs text-sage/80">
          ID: {state.documentId}
        </p>
        <button
          type="button"
          onClick={() => {
            formRef.current?.reset();
            setSelectedTags([]);
          }}
          className="mt-4 text-sm text-sage/90 underline underline-offset-2 hover:text-sage"
        >
          Submit another document
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {/* Server error banner */}
      {state && !state.success && (
        <div className="rounded-lg border border-primary/30 bg-card px-4 py-3 text-sm text-primary shadow-sm">
          {state.error}
        </div>
      )}

      {/* Title */}
      <Field label="Document title" htmlFor="title" required>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g., Letter from Apolinario Mabini to Emilio Aguinaldo, 1899"
          className={inputClass}
        />
      </Field>

      {/* Description */}
      <Field label="Brief description" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="What is this document? What makes it historically significant?"
          className={inputClass}
        />
      </Field>

      {/* Type / Date / Location / Language — 2-column grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Document type" htmlFor="document_type">
          <select id="document_type" name="document_type" className={inputClass}>
            <option value="">— select —</option>
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date of origin" htmlFor="date_of_origin" hint="Approximate is fine">
          <input
            id="date_of_origin"
            name="date_of_origin"
            type="text"
            placeholder="e.g., circa 1896, 1899-06-12"
            className={inputClass}
          />
        </Field>

        <Field label="Place of origin" htmlFor="origin_location">
          <input
            id="origin_location"
            name="origin_location"
            type="text"
            placeholder="e.g., Manila, Philippines"
            className={inputClass}
          />
        </Field>

        <Field label="Language" htmlFor="language">
          <input
            id="language"
            name="language"
            type="text"
            placeholder="e.g., Spanish, Tagalog, English"
            className={inputClass}
          />
        </Field>
      </div>

      {/* Tags */}
      <Field label="Tags" htmlFor="tag-input">
        <TagSelector selected={selectedTags} onChange={setSelectedTags} />
      </Field>

      {/* File uploads */}
      <div className="space-y-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <Field
          label="Document scan"
          htmlFor="scan"
          required
          hint="PDF, EPUB, JPEG, PNG, TIFF, or WEBP · max 10 MB"
        >
          <input
            id="scan"
            name="scan"
            type="file"
            required
            accept=".pdf,.epub,.jpg,.jpeg,.png,.tiff,.tif,.webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.size > MAX_SCAN_BYTES) {
                e.target.setCustomValidity('File exceeds the 50 MB limit.');
              } else {
                e.target.setCustomValidity('');
              }
            }}
            className={fileInputClass}
          />
        </Field>

        <Field
          label="Your transcription"
          htmlFor="transcription"
          hint="Plain text (.txt) or Markdown (.md) · optional · max 10 MB"
        >
          <p className="mb-1.5 text-xs text-muted-foreground">
            If you&apos;ve typed out the text from this document, upload it here.
            We&apos;ll use your version instead of automated text recognition,
            which improves accuracy for older or handwritten sources.
          </p>
          <input
            id="transcription"
            name="transcription"
            type="file"
            accept=".txt,.md"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && file.size > MAX_TRANS_BYTES) {
                e.target.setCustomValidity('File exceeds the 10 MB limit.');
              } else {
                e.target.setCustomValidity('');
              }
            }}
            className={fileInputClass}
          />
        </Field>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Submitting…' : 'Submit document'}
      </Button>
    </form>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="ml-0.5 text-primary">*</span>}
        {hint && (
          <span className="ml-1.5 font-normal text-muted-foreground/70">{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-background shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary';

const fileInputClass =
  'w-full text-sm text-muted-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/50';

'use client';

import { useActionState, useRef, useState } from 'react';
import { uploadDocument } from '@/src/features/documents/actions/upload-document';
import { Button } from '@/src/components/ui/button';
import TagSelector, { type TagOption } from '@/src/features/contribute/components/TagSelector';
import type { UploadDocumentResult } from '@/src/features/documents/types';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Globe,
  Calendar,
  MapPin,
  Tag,
  Plus
} from 'lucide-react';

const DOCUMENT_TYPE_GROUPS = [
  {
    groupLabel: 'Secondary Literature (Analytical Works)',
    options: [
      { value: 'monograph_book', label: 'Monograph / Academic Book' },
      { value: 'journal_article', label: 'Journal Article & Paper' },
      { value: 'edited_volume_chapter', label: 'Edited Volume / Book Chapter' },
      { value: 'dissertation_thesis', label: 'Academic Dissertation & Thesis' },
      { value: 'translation_commentary', label: 'Translation & Critical Commentary' },
    ],
  },
  {
    groupLabel: 'Tertiary Literature & Reference Works',
    options: [
      { value: 'historiographical_survey', label: 'Historiographical Survey & Literature Review' },
      { value: 'encyclopedia_reference', label: 'Encyclopedia & Dictionary Entry' },
      { value: 'bibliography_catalog', label: 'Annotated Bibliography & Catalog' },
      { value: 'sourcebook_reader', label: 'Documentary Reader / Sourcebook' },
    ],
  },
  {
    groupLabel: 'Primary & Archival Sources',
    options: [
      { value: 'primary_archival', label: 'Primary / Archival Document' },
      { value: 'other', label: 'Other Reference' },
    ],
  },
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
  const [hasDismissedSuccess, setHasDismissedSuccess] = useState(false);

  // Custom states to show selected filename in premium custom file input UI
  const [scanFileName, setScanFileName] = useState<string | null>(null);
  const [transcriptionFileName, setTranscriptionFileName] = useState<string | null>(null);

  const handleAction = async (formData: FormData) => {
    setHasDismissedSuccess(false);
    formAction(formData);
  };

  const handleReset = () => {
    if (formRef.current) {
      formRef.current.reset();
    }
    setSelectedTags([]);
    setScanFileName(null);
    setTranscriptionFileName(null);
    setHasDismissedSuccess(true);
  };

  const isSuccess = state?.success && !hasDismissedSuccess;

  // Success view
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-sage/20 bg-card p-8 text-center shadow-lg animate-in fade-in zoom-in duration-300">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sage/10 text-sage">
          <CheckCircle2 className="h-10 w-10" />
        </div>

        <h3 className="mt-5 text-xl font-semibold text-foreground">
          Document Submitted Successfully
        </h3>

        <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
          Your document is now in the processing pipeline. The AI will extract the text, generate vector embeddings, and scan for historical contradictions against existing publications.
        </p>

        <div className="mt-6 flex flex-col items-center gap-1.5 rounded-lg bg-muted/50 px-4 py-2.5 font-mono text-xs text-muted-foreground border border-border">
          <span>DOCUMENT ID</span>
          <span className="font-semibold text-foreground select-all">{state.documentId}</span>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="mt-8 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/95 hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-4 w-4" />
          Submit Another Document
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={handleAction}
      className="space-y-8 rounded-2xl border border-border bg-card/50 p-4 sm:p-6 md:p-8 shadow-sm backdrop-blur-sm"
    >
      {/* Server error banner */}
      {state && !state.success && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm text-destructive shadow-sm animate-in slide-in-from-top-2 duration-200">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Submission failed</h4>
            <p className="mt-0.5 text-destructive/90">{state.error}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: Bibliography metadata */}
      <div className="space-y-6">
        <div className="border-b border-border pb-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-sage" />
            Bibliographic Information
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Provide the metadata details for cataloging and search.
          </p>
        </div>

        {/* Title */}
        <Field label="Document Title" htmlFor="title" required>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="e.g., Letter from Apolinario Mabini to Emilio Aguinaldo, 1899"
            className={inputClass}
          />
        </Field>

        {/* Author / Historian */}
        <Field label="Author / Historian" htmlFor="author_name" hint="Leave blank to default to your profile name">
          <input
            id="author_name"
            name="author_name"
            type="text"
            placeholder="e.g., Teodoro Agoncillo, Horacio de la Costa"
            className={inputClass}
          />
        </Field>

        {/* Description */}
        <Field label="Brief Description" htmlFor="description">
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What is this document? What makes it historically significant?"
            className={inputClass}
          />
        </Field>

        {/* Type / Date / Location / Language — 2-column grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Document Type" htmlFor="document_type">
            <div className="relative">
              <select id="document_type" name="document_type" className={`${inputClass} appearance-none pr-8 truncate text-xs sm:text-sm`}>
                <option value="" className="text-xs sm:text-sm">— select type —</option>
                {DOCUMENT_TYPE_GROUPS.map((group) => (
                  <optgroup key={group.groupLabel} label={group.groupLabel} className="text-xs sm:text-sm font-semibold">
                    {group.options.map((t) => (
                      <option key={t.value} value={t.value} className="text-xs sm:text-sm">
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/80">
                <span className="text-xs">▼</span>
              </div>
            </div>
          </Field>

          <Field label="Date of Origin" htmlFor="date_of_origin" hint="Approximate is fine" icon={<Calendar className="h-4 w-4" />}>
            <input
              id="date_of_origin"
              name="date_of_origin"
              type="text"
              placeholder="e.g., circa 1896, 1899-06-12"
              className={inputClass}
            />
          </Field>

          <Field label="Place of Origin" htmlFor="origin_location" icon={<MapPin className="h-4 w-4" />}>
            <input
              id="origin_location"
              name="origin_location"
              type="text"
              placeholder="e.g., Kawit, Cavite, Philippines"
              className={inputClass}
            />
          </Field>

          <Field label="Language" htmlFor="language" icon={<Globe className="h-4 w-4" />}>
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
        <Field label="Tags / Classifications" htmlFor="tag-input" icon={<Tag className="h-4 w-4" />}>
          <TagSelector selected={selectedTags} onChange={setSelectedTags} />
        </Field>
      </div>

      {/* SECTION 2: Files */}
      <div className="space-y-6 pt-2">
        <div className="border-b border-border pb-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Upload className="h-5 w-5 text-sage" />
            Source Files
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Upload the document file (PDF, EPUB, or images). PDF and EPUB files are automatically parsed, sectioned, and indexed into the GraphRAG knowledge engine.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 rounded-md bg-sage/10 border border-sage/20 px-2 py-0.5 font-medium text-sage">
              ⚡ Direct Text Indexing: PDF, EPUB
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-medium text-muted-foreground border border-border">
              📄 Optional Transcription: TXT, MD
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Document Scan Upload Box */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              Document Scan <span className="text-primary">*</span>
            </label>
            <div className="relative flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:bg-muted/40 group">
              <input
                id="scan"
                name="scan"
                type="file"
                required
                accept=".pdf,.epub,.jpg,.jpeg,.png,.tiff,.tif,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > MAX_SCAN_BYTES) {
                      e.target.setCustomValidity('File exceeds the 50 MB limit.');
                      setScanFileName(null);
                    } else {
                      e.target.setCustomValidity('');
                      setScanFileName(file.name);
                    }
                  } else {
                    setScanFileName(null);
                  }
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border group-hover:border-sage/50 text-muted-foreground transition">
                  <Upload className="h-5 w-5 group-hover:text-sage transition" />
                </div>
                <div className="text-xs text-foreground font-semibold">
                  {scanFileName ? (
                    <span className="text-sage flex items-center justify-center gap-1 break-all px-2">
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      {scanFileName}
                    </span>
                  ) : (
                    "Click or drag document here to upload"
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground/80 leading-normal">
                  PDF, EPUB, JPEG, PNG, TIFF, or WEBP <br /> max 50 MB
                </div>
              </div>
            </div>
          </div>

          {/* Transcription Upload Box */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
              Your Transcription <span className="text-muted-foreground/60 font-normal">(Optional)</span>
            </label>
            <div className="relative flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 px-6 py-8 text-center transition hover:bg-muted/40 group">
              <input
                id="transcription"
                name="transcription"
                type="file"
                accept=".txt,.md"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > MAX_TRANS_BYTES) {
                      e.target.setCustomValidity('File exceeds the 10 MB limit.');
                      setTranscriptionFileName(null);
                    } else {
                      e.target.setCustomValidity('');
                      setTranscriptionFileName(file.name);
                    }
                  } else {
                    setTranscriptionFileName(null);
                  }
                }}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
              <div className="space-y-2 pointer-events-none">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-background border border-border group-hover:border-sage/50 text-muted-foreground transition">
                  <FileText className="h-5 w-5 group-hover:text-sage transition" />
                </div>
                <div className="text-xs text-foreground font-semibold">
                  {transcriptionFileName ? (
                    <span className="text-sage flex items-center justify-center gap-1 break-all px-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      {transcriptionFileName}
                    </span>
                  ) : (
                    "Click or drag file here to upload"
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground/80 leading-normal">
                  Plain text (.txt) or Markdown (.md) <br /> max 10 MB
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full py-6 text-base font-semibold shadow-md transition-all hover:shadow-lg disabled:opacity-50"
      >
        {isPending ? 'Ingesting & Analyzing Document...' : 'Submit Document'}
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
  icon,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs sm:text-sm font-medium text-foreground flex flex-wrap items-center justify-between gap-1"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
          {required && <span className="text-primary">*</span>}
        </span>
        {hint && (
          <span className="text-[10px] sm:text-[11px] font-normal text-muted-foreground/75 leading-none">{hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-border bg-background shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary transition-all';

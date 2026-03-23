'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { saveEssay, submitEssayForReview } from '@/actions/essay';

type InitialData = {
  title: string;
  slug: string;
  summary: string;
  lensLabel: string;
  content: string;
};

type Props = {
  essayId?: string;
  initialData?: InitialData;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function EssayEditor({ essayId, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [summary, setSummary] = useState(initialData?.summary ?? '');
  const [lensLabel, setLensLabel] = useState(initialData?.lensLabel ?? '');
  const [content, setContent] = useState(initialData?.content ?? '');
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value);
  }

  function handleSave() {
    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      if (essayId) formData.set('essayId', essayId);
      formData.set('title', title);
      formData.set('slug', slug);
      formData.set('summary', summary);
      formData.set('lens_label', lensLabel);
      formData.set('content', content);

      const result = await saveEssay(formData);
      if (result.success) {
        router.push(`/essays/${result.slug}`);
      } else {
        setError(result.error);
      }
    });
  }

  function handleSubmitForReview() {
    if (!essayId) return;
    startTransition(async () => {
      setError(null);
      const result = await submitEssayForReview(essayId);
      if (!result.success) {
        setError(result.error);
      } else {
        router.push('/essays');
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. The Role of Ilustrados in Philippine Nationalism"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">URL slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="ilustrados-philippine-nationalism"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <p className="text-xs text-muted-foreground">
          Used in the URL: /essays/<strong>{slug || '…'}</strong>
        </p>
      </div>

      {/* Lens label */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Historian&apos;s perspective label{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <input
          type="text"
          value={lensLabel}
          onChange={(e) => setLensLabel(e.target.value)}
          placeholder="e.g. Nationalist perspective, Colonial lens…"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-muted-foreground">
          Shown as a badge when readers browse perspectives.
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Summary{' '}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="A brief description of the essay's argument…"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Content */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Essay content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your interpretive essay here…"
          rows={16}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 flex-wrap">
        <Button
          onClick={handleSave}
          disabled={isPending || !title || !slug}
          variant="outline"
        >
          {isPending ? 'Saving…' : 'Save draft'}
        </Button>

        {essayId && (
          <Button
            onClick={handleSubmitForReview}
            disabled={isPending || !title || !slug || !content}
          >
            Submit for review
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
          type="button"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

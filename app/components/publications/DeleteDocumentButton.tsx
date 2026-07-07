'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDocument } from '@/actions/upload-document';
import { Button } from '@/app/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';

export default function DeleteDocumentButton({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteDocument(documentId);
      if (result.success) {
        router.push('/publications');
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); setError(null); }}>
      <PopoverTrigger
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
      >
        <svg
          className="size-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
        Remove
      </PopoverTrigger>

      <PopoverContent align="end" side="bottom" sideOffset={8} className="w-80">
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            Remove this publication?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">{documentTitle}</span>{' '}
            will be permanently removed along with its chunks, tags, and validations.
          </p>

          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Removing\u2026' : 'Remove permanently'}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

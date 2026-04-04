'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Props = {
  documentTitle: string;
  documentDate: string | null;
  score: number;
  excerpt: string;
  position: number;
};

/**
 * Inline citation chip that displays as [N] and expands on click to show
 * document metadata and an excerpt from the source.
 */
export default function CitationChip({
  documentTitle,
  documentDate,
  score,
  excerpt,
  position,
}: Props) {
  return (
    <span className="relative inline-block">
      <Popover>
        <PopoverTrigger
          className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          aria-label={`View source ${position + 1}: ${documentTitle}`}
        >
          [{position + 1}]
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-72 max-w-[calc(100vw-2rem)] max-h-[50vh] overflow-y-auto p-3 text-left z-50"
        >
          <span className="block text-xs font-semibold text-foreground leading-snug mb-1">
            {documentTitle}
          </span>
          {documentDate && (
            <span className="block text-xs text-muted-foreground mb-2">
              {documentDate}
            </span>
          )}
          <span className="block text-xs text-muted-foreground italic leading-relaxed border-l-2 border-primary/30 pl-2 mb-2">
            &ldquo;{excerpt.length > 180 ? excerpt.slice(0, 180) + '…' : excerpt}&rdquo;
          </span>
          <span className="block text-xs text-muted-foreground">
            Relevance: {(score * 100).toFixed(0)}%
          </span>
        </PopoverContent>
      </Popover>
    </span>
  );
}

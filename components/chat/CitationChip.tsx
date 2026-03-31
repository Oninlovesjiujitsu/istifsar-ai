'use client';

import { useState } from 'react';

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
  const [expanded, setExpanded] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
        aria-expanded={expanded}
        aria-label={`View source ${position + 1}: ${documentTitle}`}
      >
        [{position + 1}]
      </button>

      {expanded && (
        <span
          className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-lg border border-border bg-card p-3 shadow-lg text-left"
          role="tooltip"
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
        </span>
      )}
    </span>
  );
}

'use client';

import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import CitationChip from './CitationChip';

export type CitationData = {
  documentId: string;
  documentTitle: string;
  documentDate: string | null;
  excerpt: string;
  score: number;
  authorUsername: string | null;
  authorDisplayName: string | null;
};

type Props = {
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationData[];
  isStreaming?: boolean;
  targetScholar?: string;
  diveDeeperScholars?: string[];
  onDiveDeeper?: (scholarName: string) => void;
  onCitationClick?: (citation: CitationData) => void;
};

/**
 * Convert bare citation markers like [1], [2] into markdown links
 * using a custom protocol so react-markdown's `a` override can
 * render them as interactive buttons.
 *
 * "[1]" → "[\\[1\\]](cite:0)"   (cite: uses 0-based index)
 */
function linkifyCitations(text: string, citationCount: number): string {
  return text.replace(/\[(\d+)\]/g, (match, num) => {
    const index = parseInt(num, 10) - 1;
    if (index >= 0 && index < citationCount) {
      // Escape the brackets in the link text so Markdown renders them literally
      return `[\\[${num}\\]](cite:${index})`;
    }
    return match;
  });
}

export default function MessageBubble({
  role,
  content,
  citations,
  isStreaming,
  targetScholar,
  diveDeeperScholars,
  onDiveDeeper,
  onCitationClick,
}: Props) {
  /* ── User message ───────────────────────────────────────────────── */
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] lg:max-w-2xl bg-surface-elevated p-4 lg:p-6 rounded-sm text-zinc-100 text-sm leading-relaxed border-r-4 border-gold/20">
          {content}
        </div>
      </div>
    );
  }

  const hasCitations = citations && citations.length > 0;

  // Pre-process: convert [N] markers into markdown links before rendering
  const processedContent = hasCitations
    ? linkifyCitations(content, citations.length)
    : content;

  /** Check if any [N] marker in the text matches a real citation. */
  const hasInlineCitations =
    hasCitations && citations.some((_, i) => content.includes(`[${i + 1}]`));

  return (
    <div className="flex justify-start">
      <div className="flex flex-col gap-3 max-w-[85%] lg:max-w-3xl w-full">
        <div className="flex items-center gap-3">
          <svg
            className="w-4 h-4 text-gold shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
          <span className="text-[10px] uppercase tracking-widest text-gold/60 font-bold">
            Archivist Inquiry Response
          </span>
          {targetScholar && (
            <span className="text-[10px] uppercase tracking-wider bg-gold/10 text-gold border border-gold/20 rounded-full px-2.5 py-0.5 font-medium">
              {targetScholar}&apos;s Perspective
            </span>
          )}
        </div>

        <div className="bg-surface-elevated p-4 lg:p-6 rounded-sm text-zinc-200 text-sm lg:text-base font-light relative">
          <div className="prose prose-invert prose-zinc prose-sm lg:prose-base max-w-none prose-headings:text-gold prose-headings:font-serif prose-strong:text-zinc-100">
          <Markdown
            components={{
              a: ({ href, children }: { href?: string; children?: ReactNode }) => {
                if (href?.startsWith('cite:')) {
                  const citationIndex = parseInt(href.split(':')[1], 10);
                  const citation = citations?.[citationIndex];
                  if (citation && onCitationClick) {
                    return (
                      <button
                        type="button"
                        onClick={() => onCitationClick(citation)}
                        className="not-prose inline-flex items-center px-2 py-0.5 rounded-full bg-surface-vault text-gold text-xs cursor-pointer hover:shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all font-mono mx-1 border border-gold/20"
                        aria-label={`View source ${citationIndex + 1}: ${citation.documentTitle}`}
                      >
                        {children}
                      </button>
                    );
                  }
                  return <span>{children}</span>;
                }
                return (
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                );
              },
            }}
          >
            {processedContent}
          </Markdown>
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-gold opacity-70" />
          )}
          </div>

          <div className="absolute -right-1 -bottom-1 w-8 h-8 border-b-2 border-r-2 border-gold/20 pointer-events-none" />
        </div>

        {!hasInlineCitations && hasCitations && (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            <span className="text-xs text-text-muted-vault">Sources:</span>
            {citations.map((citation, i) => (
              <CitationChip
                key={citation.documentId + i}
                position={i}
                documentTitle={citation.documentTitle}
                onClick={() => onCitationClick?.(citation)}
              />
            ))}
          </div>
        )}

        {diveDeeperScholars && diveDeeperScholars.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 pt-1">
            {diveDeeperScholars.map((scholar) => (
              <button
                key={scholar}
                type="button"
                onClick={() => onDiveDeeper?.(scholar)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-gold/20 bg-gold/5 px-3 py-1.5 text-xs text-gold hover:bg-gold/10 hover:border-gold/40 transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                Explore {scholar}&apos;s perspective
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

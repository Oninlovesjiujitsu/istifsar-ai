'use client';

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
  onCitationClick?: (citation: CitationData) => void;
};

type TextPart = { type: 'text'; value: string };
type CitationPart = { type: 'citation'; index: number };
type ContentPart = TextPart | CitationPart;

/** Parse [1], [2], etc. in text and split into text/citation segments. */
function parseInlineCitations(text: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const regex = /\[(\d+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'citation', index: parseInt(match[1], 10) - 1 });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

export default function MessageBubble({
  role,
  content,
  citations,
  isStreaming,
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

  const parts = parseInlineCitations(content);
  const hasInlineCitations = citations && parts.some((p) => p.type === 'citation');

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
        </div>

        <div className="bg-surface-elevated p-4 lg:p-6 rounded-sm text-zinc-200 text-sm lg:text-base leading-relaxed lg:leading-loose font-light relative">
          <div className="whitespace-pre-wrap">
            {hasInlineCitations
              ? parts.map((part, i) => {
                  if (part.type === 'text') {
                    return <span key={i}>{part.value}</span>;
                  }
                  const citation = citations[part.index];
                  if (!citation) {
                    return <span key={i}>[{part.index + 1}]</span>;
                  }
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => onCitationClick?.(citation)}
                      className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-vault text-gold text-xs cursor-pointer hover:shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all font-mono mx-1 border border-gold/20"
                      aria-label={`View source ${part.index + 1}: ${citation.documentTitle}`}
                    >
                      [{part.index + 1}]
                    </button>
                  );
                })
              : content}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-gold opacity-70" />
            )}
          </div>

          <div className="absolute -right-1 -bottom-1 w-8 h-8 border-b-2 border-r-2 border-gold/20 pointer-events-none" />
        </div>

        {!hasInlineCitations && citations && citations.length > 0 && (
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
      </div>
    </div>
  );
}

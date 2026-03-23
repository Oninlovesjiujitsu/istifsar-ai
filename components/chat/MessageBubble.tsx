'use client';

import CitationChip from './CitationChip';

export type CitationData = {
  documentId: string;
  documentTitle: string;
  documentDate: string | null;
  excerpt: string;
  score: number;
};

type Props = {
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationData[];
  isStreaming?: boolean;
};

/**
 * A single message bubble in the chat interface.
 * - User messages are right-aligned with a primary colour background.
 * - Assistant messages are left-aligned in a card style with optional citation chips.
 */
export default function MessageBubble({
  role,
  content,
  citations,
  isStreaming,
}: Props) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground text-sm leading-relaxed shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-3">
        {/* Message card */}
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm leading-relaxed shadow-sm">
          <p className="whitespace-pre-wrap text-foreground">
            {content}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current opacity-70" />
            )}
          </p>
        </div>

        {/* Citations */}
        {citations && citations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-1">
            <span className="text-xs text-muted-foreground">Sources:</span>
            {citations.map((citation, i) => (
              <CitationChip
                key={citation.documentId + i}
                position={i}
                documentTitle={citation.documentTitle}
                documentDate={citation.documentDate}
                score={citation.score}
                excerpt={citation.excerpt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

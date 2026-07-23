'use client';

import type { ReactNode } from 'react';
import Markdown from 'react-markdown';
import type { ContentionMeta } from '@/src/types/contention';
import { cn } from '@/src/lib/utils';

export type CitationData = {
  documentId: string;
  documentTitle: string;
  documentDate: string | null;
  excerpt: string;
  score: number;
  authorUsername: string | null;
  authorDisplayName: string | null;
  citationNumber?: number;
};

type Props = {
  role: 'user' | 'assistant';
  content: string;
  citations?: CitationData[];
  contentions?: ContentionMeta[];
  isStreaming?: boolean;
  targetScholar?: string;
  topicName?: string | null;
  diveDeeperScholars?: string[];
  onDiveDeeper?: (scholarName: string) => void;
  onCitationClick?: (citation: CitationData) => void;
  isContentionPanelOpen?: boolean;
  onToggleContentionPanel?: () => void;
};

function linkifyCitations(text: string, citationCount: number): string {
  return text.replace(/\[(?:Source\s*)?[\d\s,(?:Source)]+\]/gi, (match) => {
    const numbers = match.match(/\d+/g);
    if (!numbers) return match;

    const links = numbers
      .map((n) => {
        const index = parseInt(n, 10) - 1;
        if (index >= 0 && index < citationCount) {
          return `[\\[${n}\\]](#cite-${n})`;
        }
        return null;
      })
      .filter(Boolean);

    return links.length > 0 ? links.join(', ') : match;
  });
}

export default function MessageBubble({
  role,
  content,
  citations,
  contentions,
  isStreaming,
  targetScholar,
  topicName,
  diveDeeperScholars,
  onDiveDeeper,
  onCitationClick,
  isContentionPanelOpen,
  onToggleContentionPanel,
}: Props) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] lg:max-w-2xl">
          {topicName && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1 block text-right">
              {topicName}
            </span>
          )}
          <div className="bg-card/50 border border-border shadow-sm p-4 lg:p-6 rounded-sm text-foreground text-sm leading-relaxed border-r-4 border-primary/30">
            {content}
          </div>
        </div>
      </div>
    );
  }

  const hasCitations = citations && citations.length > 0;

  // Pre-process: convert [N] markers into markdown links before rendering
  const processedContent = hasCitations
    ? linkifyCitations(content, citations.length)
    : content;

  return (
    <div className="flex justify-start">
      <div className="flex flex-col gap-3 max-w-[85%] lg:max-w-3xl w-full">
        <div className="flex items-center gap-3">
          <svg
            className="w-4 h-4 text-primary shrink-0"
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
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Archivist Inquiry Response
          </span>
          {targetScholar && (
            <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5 font-medium">
              {targetScholar}&apos;s Perspective
            </span>
          )}
        </div>

        <div className="bg-card border border-border shadow-sm p-4 lg:p-6 rounded-sm text-foreground text-sm lg:text-base font-light relative">
          <div className="prose prose-zinc prose-sm lg:prose-base max-w-none prose-headings:text-primary prose-headings:font-serif prose-strong:text-foreground">
            <Markdown
              components={{
                a: ({ href, children }: { href?: string; children?: ReactNode }) => {
                  if (href?.startsWith('#cite-')) {
                    const sourceNum = parseInt(href.split('-')[1], 10);
                    const citationIndex = sourceNum - 1;
                    const citation = citations?.[citationIndex];
                    if (citation) {
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCitationClick?.({
                              ...citation,
                              citationNumber: sourceNum,
                            });
                          }}
                          className="not-prose inline-flex items-center px-2 py-0.5 rounded-full bg-muted/50 !text-primary text-xs cursor-pointer hover:shadow-sm transition-all font-mono mx-1 border border-border"
                          aria-label={`View source ${sourceNum}: ${citation.documentTitle}`}
                        >
                          {children}
                        </button>
                      );
                    }
                    return <span className="!text-primary">{children}</span>;
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
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary opacity-70" />
            )}
          </div>

          <div className="absolute -right-1 -bottom-1 w-8 h-8 border-b-2 border-r-2 border-primary/20 pointer-events-none" />

          {contentions && contentions.length > 0 && !isStreaming && onToggleContentionPanel && (
            <button
              type="button"
              onClick={onToggleContentionPanel}
              aria-pressed={isContentionPanelOpen}
              className={cn(
                'mt-4 inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors',
                isContentionPanelOpen
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted/20 hover:text-foreground',
              )}
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
                />
              </svg>
              <span>
                {contentions.length === 1
                  ? 'View Node of Contention'
                  : `View ${contentions.length} Nodes of Contention`}
              </span>
            </button>
          )}
        </div>

        {diveDeeperScholars && diveDeeperScholars.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1 pt-1">
            {diveDeeperScholars.map((scholar) => (
              <button
                key={scholar}
                type="button"
                onClick={() => onDiveDeeper?.(scholar)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors"
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


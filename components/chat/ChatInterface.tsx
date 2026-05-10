'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import MessageBubble from './MessageBubble';
import type { CitationData } from './MessageBubble';
import type { ContentionMeta } from '@/types/contention';
import ChatInput from './ChatInput';
import type { TopicOption } from './ChatInput';
import ModeToggle from './ModeToggle';
import SourceDetailsPanel from './SourceDetailsPanel';
import ContentionCanvasPanel from './ContentionCanvasPanel';
import { createConversation } from '@/actions/conversation';

type RightPanelState =
  | { kind: 'citation'; citation: CitationData }
  | { kind: 'contention'; contentions: ContentionMeta[]; messageId: string }
  | null;

type Props = {
  conversationId: string | null;
  initialMessages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: RagMetadata;
  }>;
  initialMode: 'scholarly_consensus' | 'scholar_lens';
  lensTitle?: string | null;
  topics?: TopicOption[];
  initialTopicId?: string | null;
  documentId?: string | null;
  documentTitle?: string | null;
};

type CitationMeta = {
  position: number;
  documentId: string;
  documentTitle: string;
  documentDate: string | null;
  excerpt: string;
  score: number;
  authorUsername: string | null;
  authorDisplayName: string | null;
};

type RagMetadata = {
  citations?: CitationMeta[];
  contentions?: ContentionMeta[];
  noDocument?: boolean;
  targetScholar?: string;
};

type RagUIMessage = UIMessage<RagMetadata>;

/** Minimum per-scholar citation count to show a Dive Deeper button. */
const DIVE_DEEPER_CITATION_THRESHOLD = 2;

/** Extract text content from a UIMessage's parts array. */
function getMessageText(message: UIMessage): string {
  const text = message.parts
    .filter((p): p is { type: 'text'; text: string } & typeof p => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('');

  if (text.trim().length > 0) return text;

  return message.parts
    .filter((p): p is { type: 'reasoning'; text: string } & typeof p => p.type === 'reasoning')
    .map((p) => (p as { type: 'reasoning'; text: string }).text)
    .join('');
}

/** Extract citation data from message metadata. */
function extractCitations(metadata: unknown): CitationData[] | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const meta = metadata as RagMetadata;
  if (!meta.citations || meta.citations.length === 0) return undefined;
  return meta.citations.map((c) => ({
    documentId: c.documentId,
    documentTitle: c.documentTitle,
    documentDate: c.documentDate,
    excerpt: c.excerpt,
    score: c.score,
    authorUsername: c.authorUsername ?? null,
    authorDisplayName: c.authorDisplayName ?? null,
  }));
}

/** Extract the targetScholar field from message metadata (set on Dive Deeper responses). */
function extractTargetScholar(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  return (metadata as RagMetadata).targetScholar;
}

/** Extract contention data from message metadata. */
function extractContentions(metadata: unknown): ContentionMeta[] | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const meta = metadata as RagMetadata;
  console.log('[Client] Message metadata:', {
    hasCitations: !!meta.citations?.length,
    hasContentions: !!meta.contentions?.length,
    contentionCount: meta.contentions?.length ?? 0,
  });
  if (!meta.contentions || meta.contentions.length === 0) return undefined;
  return meta.contentions;
}

/**
 * Derive scholars eligible for "Dive Deeper" from a message's citations.
 * Returns scholars with at least DIVE_DEEPER_CITATION_THRESHOLD citations.
 */
function getDiveDeeperScholars(citations: CitationData[] | undefined): string[] {
  if (!citations) return [];
  const counts = new Map<string, number>();
  for (const c of citations) {
    if (c.authorDisplayName) {
      counts.set(c.authorDisplayName, (counts.get(c.authorDisplayName) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= DIVE_DEEPER_CITATION_THRESHOLD)
    .map(([name]) => name);
}

function toUIMessages(
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: RagMetadata;
  }>,
): RagUIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    parts: [{ type: 'text' as const, text: m.content }],
    metadata: m.metadata,
  }));
}

export default function ChatInterface({
  conversationId: initialConversationId,
  initialMessages,
  initialMode,
  lensTitle,
  topics,
  initialTopicId,
  documentId,
  documentTitle,
}: Props) {
  const router = useRouter();
  const [isSwitching, startSwitchTransition] = useTransition();
  const messageListRef = useRef<HTMLDivElement>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(initialTopicId ?? null);
  const [rightPanel, setRightPanel] = useState<RightPanelState>(null);

  const openCitationPanel = (citation: CitationData) =>
    setRightPanel({ kind: 'citation', citation });

  const toggleContentionPanel = (messageId: string, contentions: ContentionMeta[]) =>
    setRightPanel((prev) =>
      prev?.kind === 'contention' && prev.messageId === messageId
        ? null
        : { kind: 'contention', contentions, messageId },
    );

  const closeRightPanel = () => setRightPanel(null);

  // Track the real conversation ID — null means draft (not yet persisted)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const isDraft = activeConversationId === null;

  // Refs for values that change mid-conversation — read at request time via function body
  const conversationIdRef = useRef(initialConversationId);
  const selectedTopicRef = useRef<string | null>(initialTopicId ?? null);
  conversationIdRef.current = activeConversationId;
  selectedTopicRef.current = selectedTopicId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          conversationId: conversationIdRef.current,
          lensTitle,
          topicTagId: documentId ? null : selectedTopicRef.current,
          documentId: documentId ?? null,
          documentTitle: documentId ? documentTitle : null,
        }),
      }),
    [lensTitle, documentId, documentTitle],
  );

  const { messages, sendMessage, status, setMessages, error } = useChat<RagUIMessage>({
    transport,
    messages: toUIMessages(initialMessages),
    onError: (err) => console.error('[useChat error]', err),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Show Dive Deeper only in scholarly_consensus mode and not document-scoped
  const showDiveDeeper = initialMode === 'scholarly_consensus' && !documentId;

  // Auto-scroll the message list
  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function handleSubmit(text: string) {
    if (isDraft) {
      // Create the conversation on first message, then redirect
      setIsCreatingConversation(true);
      try {
        const result = await createConversation(
          initialMode,
          undefined,
          documentId ?? undefined,
          selectedTopicId ?? undefined,
        );
        if (result.success) {
          setActiveConversationId(result.conversationId);
          conversationIdRef.current = result.conversationId;
          // Replace /explore/new with the real URL so back-button doesn't return to draft
          window.history.replaceState(null, '', `/explore/${result.conversationId}`);
          sendMessage({ text });
        }
      } finally {
        setIsCreatingConversation(false);
      }
      return;
    }
    sendMessage({ text });
  }

  function handleDiveDeeper(scholarName: string) {
    // Find the last real user query (not a Dive Deeper "Analyze this..." message)
    const lastRealQuery = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === 'user' &&
          !getMessageText(m).startsWith('Analyze this through '),
      );
    const semanticQuery = lastRealQuery ? getMessageText(lastRealQuery) : '';

    sendMessage(
      { text: `Analyze this through ${scholarName}'s perspective.` },
      { body: { targetScholar: scholarName, semanticQuery } },
    );
  }

  function handleModeChange(nextMode: 'scholarly_consensus' | 'scholar_lens', essayId?: string) {
    startSwitchTransition(async () => {
      const result = await createConversation(nextMode, essayId);
      if (result.success) {
        setMessages([]);
        router.push(`/explore/${result.conversationId}`);
      }
    });
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-1 min-h-0 min-w-0 flex-col bg-[#131313] relative">
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold rounded-full blur-[120px]" />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] bg-surface-vault/50 backdrop-blur-sm px-4 lg:px-6 py-2 relative z-10">
          <ModeToggle
            mode={initialMode}
            onChange={handleModeChange}
            disabled={isLoading || isSwitching}
          />
          {documentTitle && (
            <span className="text-xs text-text-muted-vault truncate max-w-[60%]">
              Asking about: <span className="font-medium text-zinc-300">{documentTitle}</span>
            </span>
          )}
          {!documentTitle && lensTitle && (
            <span className="text-xs text-text-muted-vault">
              Lens: <span className="font-medium text-zinc-300">{lensTitle}</span>
            </span>
          )}
        </div>

        <div
          ref={messageListRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-none px-4 lg:px-12 py-6 lg:py-12 space-y-6 lg:space-y-10 relative z-[1]"
        >
          {messages.length === 0 && !isLoading && (
            <div className="flex h-full items-center justify-center text-text-muted-vault text-sm">
              Ask a question to start exploring scholarly sources.
            </div>
          )}

          {messages.map((message, i) => {
            const isLastMessage = i === messages.length - 1;
            const isStreamingMessage =
              isLastMessage && isLoading && message.role === 'assistant';
            const text = getMessageText(message);
            const citations = extractCitations(message.metadata);
            const contentions = extractContentions(message.metadata);
            const targetScholar = extractTargetScholar(message.metadata);

            // Derive eligible scholars for Dive Deeper buttons
            const diveDeeperScholars =
              showDiveDeeper && message.role === 'assistant' && !isStreamingMessage && !targetScholar
                ? getDiveDeeperScholars(citations)
                : [];

            return (
              <MessageBubble
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                content={text}
                citations={citations}
                contentions={contentions}
                isStreaming={isStreamingMessage}
                targetScholar={targetScholar}
                diveDeeperScholars={diveDeeperScholars}
                onDiveDeeper={handleDiveDeeper}
                onCitationClick={openCitationPanel}
                isContentionPanelOpen={
                  rightPanel?.kind === 'contention' && rightPanel.messageId === message.id
                }
                onToggleContentionPanel={
                  contentions && contentions.length > 0
                    ? () => toggleContentionPanel(message.id, contentions)
                    : undefined
                }
              />
            );
          })}

          {isLoading &&
            (messages.length === 0 ||
              messages[messages.length - 1].role === 'user') && (
              <div className="flex justify-start">
                <div className="rounded-sm bg-surface-elevated px-4 py-3 text-sm text-text-muted-vault shadow-sm">
                  <span className="flex items-center gap-2">
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gold animate-bounce [animation-delay:300ms]" />
                    </span>
                    {documentId ? 'Exploring this source…' : 'Exploring sources…'}
                  </span>
                </div>
              </div>
            )}

          {status === 'error' && error && (
            <div className="flex justify-start">
              <div className="rounded-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm shadow-sm max-w-[85%]">
                <p className="font-medium text-destructive">Something went wrong</p>
                <p className="mt-1 text-text-muted-vault text-xs">{error.message}</p>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 lg:px-12 pb-4 lg:pb-8 relative z-10">
          <ChatInput
            onSubmit={handleSubmit}
            disabled={isLoading || isSwitching || isCreatingConversation}
            placeholder={documentTitle ? `Ask about "${documentTitle}"` : 'Deepen the investigation...'}
            topics={documentId ? undefined : topics}
            selectedTopicId={selectedTopicId}
            onTopicChange={setSelectedTopicId}
          />
          <p className="mt-1.5 text-center text-xs text-text-muted-vault/60">
            Answers are grounded in authenticated and scholarly sources only.
          </p>
        </div>
      </div>

      {rightPanel && (
        <>
          <div className="hidden md:flex w-[40%] shrink-0 border-l border-white/[0.06]">
            {rightPanel.kind === 'citation' ? (
              <SourceDetailsPanel citation={rightPanel.citation} onClose={closeRightPanel} />
            ) : (
              <ContentionCanvasPanel contentions={rightPanel.contentions} onClose={closeRightPanel} />
            )}
          </div>
          <div className="md:hidden fixed inset-0 z-50">
            {rightPanel.kind === 'citation' ? (
              <SourceDetailsPanel citation={rightPanel.citation} onClose={closeRightPanel} />
            ) : (
              <ContentionCanvasPanel contentions={rightPanel.contentions} onClose={closeRightPanel} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

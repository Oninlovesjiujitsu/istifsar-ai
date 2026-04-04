'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import MessageBubble from './MessageBubble';
import type { CitationData } from './MessageBubble';
import ChatInput from './ChatInput';
import type { TopicOption } from './ChatInput';
import ModeToggle from './ModeToggle';
import { createConversation } from '@/actions/conversation';

type Props = {
  conversationId: string;
  initialMessages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: RagMetadata;
  }>;
  initialMode: 'raw_evidence' | 'interpreted';
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
};

type RagMetadata = {
  citations?: CitationMeta[];
  noDocument?: boolean;
};

type RagUIMessage = UIMessage<RagMetadata>;

/** Extract text content from a UIMessage's parts array. */
function getMessageText(message: UIMessage): string {
  const text = message.parts
    .filter((p): p is { type: 'text'; text: string } & typeof p => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('');

  // Some model/providers may stream the main output as "reasoning" parts
  // instead of "text". If we got no text parts, fall back to reasoning so
  // the user still sees an answer body.
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
  }));
}

/**
 * Convert plain server messages to the UIMessage format useChat expects.
 */
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

/**
 * Main chat interface component. Uses the Vercel AI SDK v6 useChat hook.
 */
export default function ChatInterface({
  conversationId,
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

  const { messages, sendMessage, status, setMessages, error } = useChat<RagUIMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        conversationId,
        lensTitle,
        topicTagId: documentId ? null : selectedTopicId,
        documentId: documentId ?? null,
        documentTitle: documentId ? documentTitle : null,
      },
    }),
    messages: toUIMessages(initialMessages),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll the message list only — avoid scrollIntoView on a sentinel, which can
  // bubble to the window when the inner panel doesn’t overflow and scroll the whole page
  // (hiding the mode bar above the fold).
  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(text: string) {
    sendMessage({ text });
  }

  function handleModeChange(nextMode: 'raw_evidence' | 'interpreted', essayId?: string) {
    startSwitchTransition(async () => {
      const result = await createConversation(nextMode, essayId);
      if (result.success) {
        setMessages([]);
        router.push(`/explore/${result.conversationId}`);
      }
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Mode toggle bar — shrink-0 keeps the toggle row from collapsing in nested flex layouts */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2">
        <ModeToggle
          mode={initialMode}
          onChange={handleModeChange}
          disabled={isLoading || isSwitching}
        />
        {documentTitle && (
          <span className="text-xs text-muted-foreground truncate max-w-[60%]">
            Asking about: <span className="font-medium">{documentTitle}</span>
          </span>
        )}
        {!documentTitle && lensTitle && (
          <span className="text-xs text-muted-foreground">
            Lens: <span className="font-medium">{lensTitle}</span>
          </span>
        )}
      </div>

      {/* Message list — min-h-0 lets flex-1 shrink so overflow-y-auto scrolls inside the viewport */}
      <div
        ref={messageListRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-none px-4 py-6 space-y-4"
      >
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Ask a question to start exploring scholarly sources.
          </div>
        )}

        {messages.map((message, i) => {
          const isLastMessage = i === messages.length - 1;
          const isStreamingMessage =
            isLastMessage && isLoading && message.role === 'assistant';
          const text = getMessageText(message);
          const citations = extractCitations(message.metadata);

          return (
            <MessageBubble
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={text}
              citations={citations}
              isStreaming={isStreamingMessage}
            />
          );
        })}

        {/* Loading indicator — shown while awaiting the first assistant token */}
        {isLoading &&
          (messages.length === 0 ||
            messages[messages.length - 1].role === 'user') && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
                <span className="flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                  </span>
                  {documentId ? 'Exploring this source…' : 'Exploring sources…'}
                </span>
              </div>
            </div>
          )}

        {/* Error display */}
        {status === 'error' && error && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm shadow-sm max-w-[85%]">
              <p className="font-medium text-destructive">Something went wrong</p>
              <p className="mt-1 text-muted-foreground text-xs">{error.message}</p>
            </div>
          </div>
        )}
      </div>


      {/* Input area */}
      <div className="shrink-0 border-t border-border bg-background px-4 py-3 sticky bottom-0 z-10">
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isLoading || isSwitching}
          placeholder={documentTitle ? `Ask about "${documentTitle}"` : 'Ask about history'}
          topics={documentId ? undefined : topics}
          selectedTopicId={selectedTopicId}
          onTopicChange={setSelectedTopicId}
        />
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Answers are grounded in authenticated and scholarly sources only.
        </p>
      </div>
    </div>
  );
}

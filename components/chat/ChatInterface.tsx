'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import MessageBubble from './MessageBubble';
import type { CitationData } from './MessageBubble';
import ChatInput from './ChatInput';
import ModeToggle from './ModeToggle';
import { createConversation } from '@/actions/conversation';

type Props = {
  conversationId: string;
  initialMessages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>;
  initialMode: 'raw_evidence' | 'interpreted';
  lensTitle?: string | null;
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
  return message.parts
    .filter((p): p is { type: 'text'; text: string } & typeof p => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
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
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string }>,
): RagUIMessage[] {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: 'text' as const, text: m.content }],
    metadata: undefined,
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
}: Props) {
  const router = useRouter();
  const [isSwitching, startSwitchTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat<RagUIMessage>({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { conversationId, lensTitle },
    }),
    messages: toUIMessages(initialMessages),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(text: string) {
    sendMessage({ text });
  }

  function handleModeChange(nextMode: 'raw_evidence' | 'interpreted') {
    startSwitchTransition(async () => {
      const result = await createConversation(nextMode);
      if (result.success) {
        setMessages([]);
        router.push(`/explore/${result.conversationId}`);
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Mode toggle bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <ModeToggle
          mode={initialMode}
          onChange={handleModeChange}
          disabled={isLoading || isSwitching}
        />
        {lensTitle && (
          <span className="text-xs text-muted-foreground">
            Lens: <span className="font-medium">{lensTitle}</span>
          </span>
        )}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Ask a question to start exploring primary sources.
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
                  Exploring primary sources…
                </span>
              </div>
            </div>
          )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border px-4 py-3">
        <ChatInput
          onSubmit={handleSubmit}
          disabled={isLoading || isSwitching}
          placeholder="Ask about the historical record…"
        />
        <p className="mt-1.5 text-center text-xs text-muted-foreground">
          Answers are grounded in verified primary sources only.
        </p>
      </div>
    </div>
  );
}

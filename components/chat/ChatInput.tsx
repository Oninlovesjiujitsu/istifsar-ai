'use client';

import { useRef, useEffect, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';

export type TopicOption = {
  id: string;
  name: string;
};

type Props = {
  onSubmit: (msg: string) => void;
  disabled?: boolean;
  placeholder?: string;
  topics?: TopicOption[];
  selectedTopicId?: string | null;
  onTopicChange?: (topicId: string) => void;
};

/**
 * Auto-growing textarea input for the chat interface.
 * - When topics are provided, a mandatory selector is shown
 * - Textarea + Send are disabled until a topic is selected
 * - Enter submits the message
 * - Shift+Enter inserts a newline
 * - Grows up to 6 rows, then scrolls internally
 */
export default function ChatInput({
  onSubmit,
  disabled,
  placeholder,
  topics,
  selectedTopicId,
  onTopicChange,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasTopics = topics && topics.length > 0;
  const topicRequired = hasTopics && !selectedTopicId;
  const isDisabled = disabled || topicRequired;

  // Auto-resize the textarea as content changes
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = parseInt(getComputedStyle(el).lineHeight) || 24;
    const maxHeight = lineHeight * 6;
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  });

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const el = ref.current;
    if (!el) return;
    const value = el.value.trim();
    if (!value || isDisabled) return;
    onSubmit(value);
    el.value = '';
    el.style.height = 'auto';
  }

  return (
    <div className="flex flex-col gap-2">
      {hasTopics && (
        <select
          value={selectedTopicId ?? ''}
          onChange={(e) => onTopicChange?.(e.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          aria-label="Select a topic"
        >
          <option value="" disabled>
            Select a topic to start asking...
          </option>
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </select>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
        <textarea
          ref={ref}
          rows={1}
          disabled={isDisabled}
          placeholder={
            topicRequired
              ? 'Select a topic above to start asking...'
              : placeholder ?? 'Ask about History'
          }
          onKeyDown={handleKeyDown}
          className="max-h-36 min-h-[2rem] flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          aria-label="Message input"
        />
        <Button
          type="button"
          size="sm"
          disabled={isDisabled}
          onClick={submit}
          className="shrink-0"
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </div>
  );
}

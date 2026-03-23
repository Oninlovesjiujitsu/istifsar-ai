'use client';

import { useRef, useEffect, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  onSubmit: (msg: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * Auto-growing textarea input for the chat interface.
 * - Enter submits the message
 * - Shift+Enter inserts a newline
 * - Grows up to 6 rows, then scrolls internally
 */
export default function ChatInput({ onSubmit, disabled, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

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
    if (!value || disabled) return;
    onSubmit(value);
    el.value = '';
    el.style.height = 'auto';
  }

  return (
    <div className="flex items-end gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/30">
      <textarea
        ref={ref}
        rows={1}
        disabled={disabled}
        placeholder={placeholder ?? 'Ask about primary sources…'}
        onKeyDown={handleKeyDown}
        className="max-h-36 min-h-[2rem] flex-1 resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        aria-label="Message input"
      />
      <Button
        type="button"
        size="sm"
        disabled={disabled}
        onClick={submit}
        className="shrink-0"
        aria-label="Send message"
      >
        Send
      </Button>
    </div>
  );
}

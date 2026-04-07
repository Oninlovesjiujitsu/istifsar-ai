'use client';

import { useRef, useEffect, type KeyboardEvent } from 'react';

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
          className="w-full rounded-sm border border-gold/20 bg-surface-vault px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-gold/40 disabled:opacity-50"
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

      <div className="relative flex items-center parchment-texture bg-[#0e0e0e] rounded-sm shadow-xl focus-within:ring-1 focus-within:ring-gold/40">
        <textarea
          ref={ref}
          rows={1}
          disabled={isDisabled}
          placeholder={
            topicRequired
              ? 'Select a topic above to start asking...'
              : placeholder ?? 'Deepen the investigation...'
          }
          onKeyDown={handleKeyDown}
          className="max-h-36 min-h-[2rem] flex-1 resize-none bg-transparent py-4 lg:py-6 px-4 lg:px-8 text-sm leading-relaxed text-zinc-200 placeholder:text-text-muted-vault/60 focus:outline-none disabled:opacity-50"
          aria-label="Message input"
        />
        <div className="absolute right-4 lg:right-6 flex items-center gap-4">
          <button
            type="button"
            disabled={isDisabled}
            onClick={submit}
            className="text-gold/60 hover:text-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

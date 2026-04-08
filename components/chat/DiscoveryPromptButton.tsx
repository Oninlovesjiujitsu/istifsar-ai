'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createConversation } from '@/actions/conversation';

type Props = {
  question: string;
};

/**
 * A card-style prompt chip. Clicking creates a new conversation and
 * navigates to it. The question text is shown as inspiration so the
 * user can type it (or rephrase it) once the chat loads.
 */
export default function DiscoveryPromptButton({ question }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createConversation('scholarly_consensus');
      if (result.success) {
        router.push(`/explore/${result.conversationId}`);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="group rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-muted/50 hover:text-foreground disabled:cursor-wait transition-all"
    >
      <span className="mr-1 text-primary opacity-70 group-hover:opacity-100">&ldquo;</span>
      {isPending ? 'Opening…' : question}
      <span className="ml-1 text-primary opacity-70 group-hover:opacity-100">&rdquo;</span>
    </button>
  );
}

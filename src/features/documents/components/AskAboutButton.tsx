'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createConversation } from '@/src/features/chat/actions/conversation';

type Props = {
  topicId?: string | null;
  documentId?: string | null;
  className?: string;
  label?: string;
  pendingLabel?: string;
};

export default function AskAboutButton({
  topicId,
  documentId,
  className = "shrink-0 text-xs bg-gold text-[#241a00] font-semibold px-3 py-1.5 rounded-full hover:bg-gold/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
  label = "Ask about this →",
  pendingLabel = 'Starting…',
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createConversation(
        documentId ?? undefined,
        topicId ?? undefined,
      );
      if (result.success) {
        router.push(`/explore/${result.conversationId}`);
      } else {
        router.push('/login');
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={className}
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createConversation } from '@/actions/conversation';

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
  className = 'shrink-0 text-xs text-primary hover:underline disabled:opacity-60 disabled:cursor-not-allowed',
  label = 'Ask about this →',
  pendingLabel = 'Starting…',
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createConversation('raw_evidence');
      if (result.success) {
        let url = `/explore/${result.conversationId}`;
        if (documentId) {
          url += `?doc=${documentId}`;
        } else if (topicId) {
          url += `?topic=${topicId}`;
        }
        router.push(url);
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

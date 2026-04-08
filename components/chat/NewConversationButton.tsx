'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createConversation } from '@/actions/conversation';
import { Button } from '@/components/ui/button';

export default function NewConversationButton() {
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
    <Button onClick={handleClick} disabled={isPending} size="lg">
      {isPending ? 'Starting…' : 'Start a new conversation'}
    </Button>
  );
}

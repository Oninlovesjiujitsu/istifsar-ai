'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { createConversation } from '@/actions/conversation';
import { Button } from '@/components/ui/button';

type Props = {
  essayId: string;
};

export default function UseLensButton({ essayId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await createConversation('scholar_lens', essayId);
      if (result.success) {
        router.push(`/explore/${result.conversationId}`);
      }
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Starting…' : 'Use as lens in a conversation'}
    </Button>
  );
}

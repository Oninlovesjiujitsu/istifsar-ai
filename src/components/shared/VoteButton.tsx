'use client';

import { useState, useTransition } from 'react';
import { toggleVote } from '@/src/actions/vote';

type Props = {
  targetType: string;
  targetId: string;
  initialCount: number;
  initialVoted: boolean;
};

export default function VoteButton({
  targetType,
  targetId,
  initialCount,
  initialVoted,
}: Props) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      // Optimistic update
      setVoted((v) => !v);
      setCount((c) => (voted ? c - 1 : c + 1));

      try {
        const result = await toggleVote(targetType, targetId);
        setVoted(result.voted);
        setCount(result.count);
      } catch {
        // Revert on error
        setVoted(voted);
        setCount(count);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={voted ? 'Remove vote' : 'Vote'}
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
        voted
          ? 'bg-primary/10 text-primary hover:bg-primary/20'
          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        isPending ? 'opacity-50 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <span aria-hidden>{voted ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  );
}

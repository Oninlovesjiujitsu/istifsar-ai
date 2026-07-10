'use client';

import { useTransition } from 'react';
import { signOut } from '@/src/features/auth/actions';

export default function SignOutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={className ?? 'text-sm hover:text-foreground transition-colors disabled:opacity-50'}
    >
      {isPending ? 'Signing out\u2026' : 'Sign out'}
    </button>
  );
}

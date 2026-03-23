'use client';

import { useTransition } from 'react';
import { signOut } from '@/actions/auth';
import { Button } from '@/components/ui/button';

export default function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await signOut();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleClick} disabled={isPending}>
      {isPending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}

'use client';

import { useTransition } from 'react';
import { changeRole } from '@/actions/admin';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/lib/ui/role-labels';

const ROLE_ORDER = ['reader', 'verified_historian', 'admin'];

type Props = {
  userId: string;
  currentRole: string;
};

export default function ChangeRoleForm({ userId, currentRole }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newRole = fd.get('role') as string;
    if (!newRole || newRole === currentRole) return;
    startTransition(async () => {
      try {
        await changeRole(userId, newRole);
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        name="role"
        defaultValue={currentRole}
        className="rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={isPending}
      >
        {ROLE_ORDER.map((value) => (
          <option key={value} value={value}>
            {ROLE_LABELS[value] ?? value}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}

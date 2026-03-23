'use client';

import { useTransition } from 'react';
import { changeTier } from '@/actions/admin';
import { Button } from '@/components/ui/button';

const TIERS = [
  { value: 'pending', label: 'Newcomer (pending)' },
  { value: 'reader', label: 'Reader' },
  { value: 'tier_3', label: 'Contributor (tier_3)' },
  { value: 'tier_2', label: 'Historian (tier_2)' },
  { value: 'tier_1', label: 'Senior Historian (tier_1)' },
  { value: 'admin', label: 'Curator (admin)' },
];

type Props = {
  userId: string;
  currentTier: string;
};

export default function ChangeTierForm({ userId, currentTier }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newTier = fd.get('tier') as string;
    if (!newTier || newTier === currentTier) return;
    startTransition(async () => {
      try {
        await changeTier(userId, newTier);
      } catch (err) {
        console.error(err);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <select
        name="tier"
        defaultValue={currentTier}
        className="rounded-md border bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={isPending}
      >
        {TIERS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}

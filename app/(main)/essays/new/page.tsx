import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EssayEditor from '@/components/essays/EssayEditor';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Write an essay — Istifsar' };

const TIER_RANK: Record<string, number> = {
  pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
};

export default async function NewEssayPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tier = (user?.app_metadata?.tier as string | undefined) ?? 'pending';
  if ((TIER_RANK[tier] ?? 0) < TIER_RANK['tier_2']) {
    redirect('/essays');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Write a historian&apos;s perspective</h1>
        <p className="text-muted-foreground">
          Contribute an interpretive essay that others can use as an analytical lens.
        </p>
      </div>
      <EssayEditor />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type Tier = 'pending' | 'reader' | 'tier_3' | 'tier_2' | 'tier_1' | 'admin';

const TIER_RANK: Record<Tier, number> = {
  pending: 0,
  reader: 1,
  tier_3: 2,
  tier_2: 3,
  tier_1: 4,
  admin: 5,
};

function tierRank(tier: string): number {
  return TIER_RANK[tier as Tier] ?? -1;
}

type ProxyOptions = {
  requireAuth?: boolean;
  minTier?: Tier;
  redirectAuthenticated?: string;
};

export async function proxy(options: ProxyOptions = {}): Promise<void> {
  const { requireAuth = false, minTier, redirectAuthenticated } = options;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (redirectAuthenticated && session) {
    redirect(redirectAuthenticated);
  }

  if (requireAuth && !session) {
    redirect('/login');
  }

  if (minTier && session) {
    const tier: string =
      (session.user.app_metadata?.tier as string | undefined) ?? 'pending';

    if (tierRank(tier) < tierRank(minTier)) {
      redirect('/');
    }
  }
}

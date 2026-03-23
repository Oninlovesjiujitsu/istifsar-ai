import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SignOutButton from '@/components/layout/SignOutButton';

const TIER_RANK: Record<string, number> = {
  pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
};

function tierRank(tier: string): number {
  return TIER_RANK[tier] ?? 0;
}

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tier = (user?.app_metadata?.tier as string | undefined) ?? 'pending';
  const isContributor = tierRank(tier) >= tierRank('tier_3');

  let displayName = 'Account';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Account';
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        {/* Brand */}
        <Link
          href="/explore"
          className="font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
        >
          Istifsar
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 text-sm">
          <Link
            href="/explore"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/documents"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Sources
          </Link>
          <Link
            href="/paths"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Paths
          </Link>
          <Link
            href="/essays"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Perspectives
          </Link>

          {/* Contribute section (tier_3+) */}
          {isContributor && (
            <>
              <Link
                href="/contribute/upload"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Upload
              </Link>
              <Link
                href="/contribute/validate"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Validate
              </Link>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground hidden sm:block">{displayName}</span>
          <SignOutButton />
        </div>
      </nav>
    </header>
  );
}

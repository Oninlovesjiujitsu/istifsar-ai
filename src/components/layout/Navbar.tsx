import { createClient } from '@/src/lib/supabase/server';
import Link from 'next/link';
import SignOutButton from '@/src/components/layout/SignOutButton';
import { getUserRole, isVerifiedHistorian, isAdmin } from '@/src/lib/ui/role-labels';
// import ThemePicker from '@/src/components/layout/ThemePicker';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = getUserRole(user);
  const canContribute = isVerifiedHistorian(role);
  const showAdmin = isAdmin(role);

  let displayName = 'Account';
  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, username')
      .eq('id', user.id)
      .single();
    displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Account';
    username = profile?.username ?? null;
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

        {/* Nav links — hidden on small screens */}
        <div className="hidden md:flex items-center gap-1 text-sm">
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
            href="/network"
            className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Network
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

          {/* Historian section */}
          {canContribute && (
            <>
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/contribute/upload"
                className="rounded-md px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Upload
              </Link>
            </>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 text-sm">
          {/* <ThemePicker /> */}
          {user && (
            <Link
              href={username ? `/profile/${username}` : '/profile'}
              className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors"
            >
              {displayName}
            </Link>
          )}
          {showAdmin && (
            <Link
              href="/admin"
              className="rounded-md px-2 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Admin
            </Link>
          )}
          <SignOutButton className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50" />
        </div>
      </nav>
    </header>
  );
}

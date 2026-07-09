import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { type Role, isVerifiedHistorian, isAdmin } from '@/lib/ui/role-labels';

type AuthGuardOptions = {
  requireAuth?: boolean;
  /** Minimum role required. 'verified_historian' also allows admin. */
  minRole?: Role;
  redirectAuthenticated?: string;
};

export async function authGuard(options: AuthGuardOptions = {}): Promise<void> {
  const { requireAuth = false, minRole, redirectAuthenticated } = options;

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (redirectAuthenticated && session) {
    redirect(redirectAuthenticated);
  }

  if (requireAuth && !session) {
    redirect('/login');
  }

  if (minRole && session) {
    let role = (session.user.app_metadata?.role as string) ?? 'reader';

    // Fallback: if the JWT hook hasn't synced the role, query profiles directly
    if (role === 'reader') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profile?.role) role = profile.role;
    }

    const allowed =
      minRole === 'reader' ||
      (minRole === 'verified_historian' && isVerifiedHistorian(role)) ||
      (minRole === 'admin' && isAdmin(role));

    if (!allowed) {
      redirect('/');
    }
  }
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { type Role, isVerifiedHistorian, isAdmin } from '@/lib/ui/role-labels';

type ProxyOptions = {
  requireAuth?: boolean;
  /** Minimum role required. 'verified_historian' also allows admin. */
  minRole?: Role;
  redirectAuthenticated?: string;
};

export async function proxy(options: ProxyOptions = {}): Promise<void> {
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
    const role = (session.user.app_metadata?.role as string) ?? 'reader';

    const allowed =
      minRole === 'reader' ||
      (minRole === 'verified_historian' && isVerifiedHistorian(role)) ||
      (minRole === 'admin' && isAdmin(role));

    if (!allowed) {
      redirect('/');
    }
  }
}

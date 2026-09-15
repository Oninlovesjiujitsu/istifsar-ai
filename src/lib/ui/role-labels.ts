/** The three user roles in the system. */
export type Role = 'reader' | 'verified_historian' | 'admin';

/** Human-readable labels for each role. */
export const ROLE_LABELS: Record<string, string> = {
  reader: 'Reader',
  verified_historian: 'Verified Historian',
  admin: 'Admin',
};

/** Tailwind badge classes for each role. */
export const ROLE_BADGE: Record<string, string> = {
  reader: 'bg-primary/10 border border-primary/20 text-primary dark:bg-primary/20 dark:text-primary-foreground font-serif',
  verified_historian: 'bg-gold/10 border border-gold/40 text-gold-dim dark:text-gold-bright font-serif',
  admin: 'bg-amber-950/10 border border-amber-800/30 text-amber-900 dark:bg-amber-900/20 dark:text-amber-300 font-serif',
};

/** Extract user role from Supabase user metadata, defaulting to 'reader'. */
export function getUserRole(user: { app_metadata?: Record<string, unknown> } | null): Role {
  return ((user?.app_metadata?.role as string) ?? 'reader') as Role;
}

/** True if the user is a verified historian or admin. */
export function isVerifiedHistorian(role: string): boolean {
  return role === 'verified_historian' || role === 'admin';
}

/** True if the user is an admin. */
export function isAdmin(role: string): boolean {
  return role === 'admin';
}

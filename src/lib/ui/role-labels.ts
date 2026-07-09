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
  reader: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  verified_historian: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
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

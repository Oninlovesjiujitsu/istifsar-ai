import { createAdminClient } from '@/src/lib/supabase/admin';
import ChangeRoleForm from '@/src/features/admin/components/ChangeTierForm';
import { ROLE_BADGE, ROLE_LABELS } from '@/src/lib/ui/role-labels';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'User Directory — Admin — Istifsar' };

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, display_name, role, institution, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 sm:space-y-10 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-dim font-serif mb-1">
          <Link href="/admin" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5 inline" /> Admin Console
          </Link>
          <span>/</span>
          <span>Accounts Directory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
          User Directory
        </h1>
        <p className="mt-1 text-base text-muted-foreground font-serif italic">
          {profiles?.length ?? 0} registered account(s) across Readers, Historians, and Administrators.
        </p>
      </div>

      <div className="overflow-x-auto rounded-md border border-border/80 bg-card parchment-texture shadow-sm vault-scrollbar">
        <table className="min-w-full divide-y divide-border/60 text-sm">
          <thead className="bg-muted/40 uppercase tracking-wider text-xs font-serif text-muted-foreground">
            <tr>
              <th scope="col" className="px-5 py-4 text-left font-semibold">Name</th>
              <th scope="col" className="px-5 py-4 text-left font-semibold">Username</th>
              <th scope="col" className="px-5 py-4 text-left font-semibold">Role Tier</th>
              <th scope="col" className="px-5 py-4 text-left font-semibold">Affiliated Institution</th>
              <th scope="col" className="px-5 py-4 text-left font-semibold">Joined Date</th>
              <th scope="col" className="px-5 py-4 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 font-serif">
            {profiles?.map((profile) => (
              <tr key={profile.id} className="hover:bg-muted/30 transition-colors">
                <td className="whitespace-nowrap px-5 py-4 font-medium text-foreground">{profile.display_name}</td>
                <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                  @{profile.username}
                </td>
                <td className="whitespace-nowrap px-5 py-4">
                  <span
                    className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-serif border ${ROLE_BADGE[profile.role] ?? ROLE_BADGE.reader}`}
                  >
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted-foreground">
                  {profile.institution ?? <span className="italic text-muted-foreground/60">—</span>}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-5 py-4">
                  <ChangeRoleForm userId={profile.id} currentRole={profile.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!profiles || profiles.length === 0) && (
          <div className="py-16 text-center text-muted-foreground font-serif">No accounts registered yet.</div>
        )}
      </div>
    </div>
  );
}


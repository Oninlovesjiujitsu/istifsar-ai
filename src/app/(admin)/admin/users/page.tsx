import { createAdminClient } from '@/src/lib/supabase/admin';
import ChangeRoleForm from '@/src/components/admin/ChangeTierForm';
import { ROLE_BADGE, ROLE_LABELS } from '@/src/lib/ui/role-labels';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users — Admin — Istifsar' };

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, display_name, role, institution, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {profiles?.length ?? 0} accounts registered.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Username</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Institution</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Change role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {profiles?.map((profile) => (
              <tr key={profile.id} className="hover:bg-muted/30 transition-colors">
                <td className="whitespace-nowrap px-4 py-3 font-medium">{profile.display_name}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  @{profile.username}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[profile.role] ?? ROLE_BADGE.reader}`}
                  >
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {profile.institution ?? <span className="italic">—</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3">
                  <ChangeRoleForm userId={profile.id} currentRole={profile.role} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!profiles || profiles.length === 0) && (
          <div className="py-16 text-center text-muted-foreground">No accounts yet.</div>
        )}
      </div>
    </div>
  );
}

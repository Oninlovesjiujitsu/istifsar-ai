import { createAdminClient } from '@/lib/supabase/admin';
import ChangeTierForm from '@/components/admin/ChangeTierForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users — Admin — Istifsar' };

const TIER_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  reader: 'bg-blue-100 text-blue-700',
  tier_3: 'bg-cyan-100 text-cyan-700',
  tier_2: 'bg-violet-100 text-violet-700',
  tier_1: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
};

const TIER_LABELS: Record<string, string> = {
  pending: 'Newcomer',
  reader: 'Reader',
  tier_3: 'Contributor',
  tier_2: 'Historian',
  tier_1: 'Senior Historian',
  admin: 'Curator',
};

export default async function AdminUsersPage() {
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, username, display_name, tier, institution, created_at')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
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
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tier</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Institution</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Joined</th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Change tier</th>
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
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIER_BADGE[profile.tier] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {TIER_LABELS[profile.tier] ?? profile.tier}
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
                  <ChangeTierForm userId={profile.id} currentTier={profile.tier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!profiles || profiles.length === 0) && (
          <div className="py-12 text-center text-muted-foreground">No accounts yet.</div>
        )}
      </div>
    </div>
  );
}

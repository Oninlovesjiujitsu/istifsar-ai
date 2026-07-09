import { createAdminClient } from '@/src/lib/supabase/admin';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Verification Queue — Admin — Istifsar' };

export default async function VerificationPage() {
  const admin = createAdminClient();

  const { data: requests } = await admin
    .from('verification_requests')
    .select('id, user_id, status, link_type, link_url, created_at, profiles!user_id(display_name, username)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-10">
      <div>
        <h1 className="text-2xl font-bold">Verification Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review historian credential requests.
        </p>
      </div>

      {requests && requests.length > 0 ? (
        <div className="divide-y rounded-lg border bg-card">
          {requests.map((req) => {
            const profile = req.profiles as { display_name: string; username: string } | null;
            return (
              <div key={req.id} className="px-6 py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{profile?.display_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(req.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="capitalize">{req.link_type.replace(/_/g, ' ')}</span>:{' '}
                  <a
                    href={req.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {req.link_url}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/20 py-16 text-center">
          <p className="text-muted-foreground">No pending verification requests.</p>
        </div>
      )}
    </div>
  );
}

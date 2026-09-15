import { createAdminClient } from '@/src/lib/supabase/admin';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Verification Queue — Admin — Istifsar' };

export default async function VerificationPage() {
  const admin = createAdminClient();

  const { data: requests } = await admin
    .from('verification_requests')
    .select('id, user_id, status, link_type, link_url, created_at, profiles!user_id(display_name, username)')
    .eq('status', 'pending')
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
          <span>Historian Credentials</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
          Verification Queue
        </h1>
        <p className="mt-1 text-base text-muted-foreground font-serif italic">
          Review academic credential applications for Verified Historian tier upgrades.
        </p>
      </div>

      {requests && requests.length > 0 ? (
        <div className="divide-y divide-border/60 rounded-md border border-border/80 bg-card parchment-texture shadow-sm">
          {requests.map((req) => {
            const profile = req.profiles as { display_name: string; username: string } | null;
            return (
              <div key={req.id} className="p-6 space-y-3 font-serif hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-heading font-semibold text-lg text-foreground">{profile?.display_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">@{profile?.username}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Submitted: {new Date(req.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground bg-surface-vault p-3 rounded border border-border/40">
                  <span className="capitalize font-semibold text-foreground">{req.link_type.replace(/_/g, ' ')}</span>:{' '}
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
        <div className="rounded-md border border-border/80 bg-card parchment-texture p-12 text-center shadow-sm">
          <CheckCircle2 className="h-10 w-10 text-sage/80 mx-auto mb-3" />
          <h3 className="font-heading text-lg font-semibold text-foreground">Verification Queue Clear</h3>
          <p className="text-sm font-serif text-muted-foreground mt-1">
            No pending historian credential requests awaiting review.
          </p>
        </div>
      )}
    </div>
  );
}


import { createClient } from '@/src/lib/supabase/server';
import SignOutButton from '@/src/components/layout/SignOutButton';
import EditDisplayName from '@/src/features/settings/components/EditDisplayName';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings — Istifsar' };

export default async function HistorianSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, bio, institution, role')
    .eq('id', user!.id)
    .single();

  return (
    <div className="min-h-full p-8 lg:p-16 xl:p-24 relative">
      <header className="max-w-2xl mx-auto mb-12 mt-8 lg:mt-12">
        <h2 className="text-3xl font-heading text-gold">Settings</h2>
        <div className="h-px w-24 bg-gradient-to-r from-gold to-transparent mt-4" />
      </header>

      <section className="max-w-2xl mx-auto space-y-8">
        {/* Profile */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Profile</h3>
          <div className="grid gap-3 text-sm">
            <EditDisplayName currentName={profile?.display_name ?? ''} />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span>@{profile?.username ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span>{user?.email ?? '—'}</span>
            </div>
            {profile?.institution && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Institution</span>
                <span>{profile.institution}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="capitalize">
                {profile?.role?.replace(/_/g, ' ') ?? 'Verified Historian'}
              </span>
            </div>
          </div>
          {profile?.bio && (
            <div className="pt-3 border-t">
              <span className="text-sm text-muted-foreground block mb-1">Bio</span>
              <p className="text-sm">{profile.bio}</p>
            </div>
          )}
          {profile?.username && (
            <div className="pt-3 border-t">
              <Link
                href={`/profile/${profile.username}`}
                className="text-sm text-gold hover:underline"
              >
                View public profile
              </Link>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Account</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Sign out of your account</p>
            <SignOutButton className="text-sm text-destructive hover:text-destructive/80 transition-colors" />
          </div>
        </div>
      </section>
    </div>
  );
}

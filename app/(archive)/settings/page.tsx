import { createClient } from '@/lib/supabase/server';
import SignOutButton from '@/components/layout/SignOutButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings — Istifsar' };

export default async function SettingsPage() {
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
    <div className="min-h-screen p-8 lg:p-16 xl:p-24 relative">
      <header className="max-w-2xl mx-auto mb-12 mt-8 lg:mt-12">
        <h2 className="text-3xl font-heading text-gold">Settings</h2>
        <div className="h-px w-24 bg-gradient-to-r from-gold to-transparent mt-4" />
      </header>

      <section className="max-w-2xl mx-auto space-y-8">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="font-semibold">Profile</h3>
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Display name</span>
              <span>{profile?.display_name ?? '—'}</span>
            </div>
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
              <span className="capitalize">{profile?.role?.replace(/_/g, ' ') ?? 'Reader'}</span>
            </div>
          </div>
        </div>

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

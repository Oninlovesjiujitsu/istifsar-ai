import { authGuard } from '@/lib/supabase/authGuard';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import SettingsClient from '@/app/components/settings/SettingsClient';

export const metadata: Metadata = { title: 'Settings — Istifsar' };

export default async function SettingsPage() {
  await authGuard({ requireAuth: true });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, bio, institution, role')
    .eq('id', user?.id || '')
    .single();

  return <SettingsClient profile={profile} email={user?.email} />;
}

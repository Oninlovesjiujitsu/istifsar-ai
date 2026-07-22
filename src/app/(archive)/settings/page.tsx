import { authGuard } from '@/src/lib/supabase/authGuard';
import { createClient } from '@/src/lib/supabase/server';
import type { Metadata } from 'next';
import SettingsClient from '@/src/features/settings/components/SettingsClient';
import { DEFAULT_USER_PREFERENCES } from '@/src/types/preferences';
import type { UserPreferences } from '@/src/types/preferences';

export const metadata: Metadata = { title: 'Settings — Istifsar' };

export default async function SettingsPage() {
  await authGuard({ requireAuth: true });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, username, bio, institution, avatar_url, role')
    .eq('id', user?.id || '')
    .single();

  const rawPreferences = user?.user_metadata?.preferences as Partial<UserPreferences> | undefined;
  const preferences: UserPreferences = {
    citation_style: rawPreferences?.citation_style ?? DEFAULT_USER_PREFERENCES.citation_style,
    ai_response_depth: rawPreferences?.ai_response_depth ?? DEFAULT_USER_PREFERENCES.ai_response_depth,
  };

  return <SettingsClient profile={profile} email={user?.email} preferences={preferences} />;
}

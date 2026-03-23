import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { proxy } from '@/proxy';

export default async function ProfileRedirectPage() {
  await proxy({ requireAuth: true });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single();

  redirect(`/profile/${profile?.username ?? user.id}`);
}

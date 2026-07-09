import { createClient } from '@/src/lib/supabase/server';
import ReaderSidebarContent from '@/src/components/layout/ReaderSidebarContent';

export default async function ReaderSidebar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, mode, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  return <ReaderSidebarContent conversations={conversations ?? []} />;
}

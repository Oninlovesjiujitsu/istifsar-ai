import { createClient } from '@/src/lib/supabase/server';
import SidebarShell from '@/src/components/layout/SidebarShell';
import ReaderSidebarContent from '@/src/features/profile/components/ReaderSidebarContent';

export default async function ArchiveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let conversations: any[] = [];
  if (user) {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, mode, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);
    conversations = data ?? [];
  }

  return (
    <SidebarShell
      sidebar={<ReaderSidebarContent conversations={conversations} isLoggedIn={!!user} />}
    >
      {children}
    </SidebarShell>
  );
}

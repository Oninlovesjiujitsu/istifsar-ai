import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import SidebarShell from '@/app/components/layout/SidebarShell';
import ReaderSidebarContent from '@/app/components/layout/ReaderSidebarContent';

export default async function ArchiveLayout({ children }: { children: React.ReactNode }) {
  await proxy({ requireAuth: true });

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

  return (
    <SidebarShell
      sidebar={<ReaderSidebarContent conversations={conversations ?? []} />}
    >
      {children}
    </SidebarShell>
  );
}

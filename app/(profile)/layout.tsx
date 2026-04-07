import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import { getUserRole, isVerifiedHistorian } from '@/lib/ui/role-labels';
import SidebarShell from '@/components/layout/SidebarShell';
import ReaderSidebarContent from '@/components/layout/ReaderSidebarContent';
import HistorianSidebarContent from '@/components/layout/HistorianSidebarContent';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  await proxy({ requireAuth: true });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = getUserRole(user);

  if (isVerifiedHistorian(role)) {
    return (
      <SidebarShell sidebar={<HistorianSidebarContent />}>
        {children}
      </SidebarShell>
    );
  }

  // Default: reader sidebar with conversations
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

import { authGuard } from '@/src/lib/supabase/authGuard';
import { createClient } from '@/src/lib/supabase/server';
import { getUserRole, isVerifiedHistorian } from '@/src/lib/ui/role-labels';
import SidebarShell from '@/src/components/layout/SidebarShell';
import ReaderSidebarContent from '@/src/components/layout/ReaderSidebarContent';
import HistorianSidebarContent from '@/src/components/layout/HistorianSidebarContent';

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  await authGuard({ requireAuth: true });

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

import { authGuard } from '@/src/lib/supabase/authGuard';
import SidebarShell from '@/src/components/layout/SidebarShell';
import HistorianSidebarContent from '@/src/features/profile/components/HistorianSidebarContent';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await authGuard({ requireAuth: true, minRole: 'verified_historian' });

  return (
    <SidebarShell sidebar={<HistorianSidebarContent />}>
      {children}
    </SidebarShell>
  );
}

import { proxy } from '@/proxy';
import SidebarShell from '@/app/components/layout/SidebarShell';
import HistorianSidebarContent from '@/app/components/layout/HistorianSidebarContent';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await proxy({ requireAuth: true, minRole: 'verified_historian' });

  return (
    <SidebarShell sidebar={<HistorianSidebarContent />}>
      {children}
    </SidebarShell>
  );
}

import { authGuard } from '@/src/lib/supabase/authGuard';
import SidebarShell from '@/src/components/layout/SidebarShell';
import AdminSidebarContent from '@/src/components/layout/AdminSidebarContent';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await authGuard({ requireAuth: true, minRole: 'admin' });

  return (
    <SidebarShell sidebar={<AdminSidebarContent />}>
      {children}
    </SidebarShell>
  );
}

import { authGuard } from '@/lib/supabase/authGuard';
import SidebarShell from '@/app/components/layout/SidebarShell';
import AdminSidebarContent from '@/app/components/layout/AdminSidebarContent';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await authGuard({ requireAuth: true, minRole: 'admin' });

  return (
    <SidebarShell sidebar={<AdminSidebarContent />}>
      {children}
    </SidebarShell>
  );
}

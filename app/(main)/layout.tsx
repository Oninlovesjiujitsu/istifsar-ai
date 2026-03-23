import { proxy } from '@/proxy';
import Navbar from '@/components/layout/Navbar';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  await proxy({ requireAuth: true });
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

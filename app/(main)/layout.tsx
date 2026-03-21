import { proxy } from '@/proxy';

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  await proxy({ requireAuth: true });
  return <>{children}</>;
}

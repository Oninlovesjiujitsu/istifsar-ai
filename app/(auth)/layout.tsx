import { proxy } from '@/proxy';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  await proxy({ redirectAuthenticated: '/' });
  return <>{children}</>;
}

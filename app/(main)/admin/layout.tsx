import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — Istifsar' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.tier !== 'admin') {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Sub-nav */}
      <nav className="mb-8 flex flex-wrap gap-1 rounded-lg border bg-muted/50 p-1.5 text-sm">
        <Link
          href="/admin"
          className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/admin/users"
          className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          Users
        </Link>
        <Link
          href="/admin/contentions"
          className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          Contentions
        </Link>
        <Link
          href="/admin/gaps"
          className="rounded-md px-3 py-1.5 font-medium text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        >
          Unanswered Queries
        </Link>
      </nav>

      {children}
    </div>
  );
}

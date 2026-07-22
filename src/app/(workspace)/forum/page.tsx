import { authGuard } from '@/src/lib/supabase/authGuard';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Community Forum — Istifsar Workspace',
};

export default async function WorkspaceForumPage() {
  await authGuard({ requireAuth: true });

  return (
    <div className="flex h-full flex-col p-4 sm:p-6 lg:p-8 relative">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <span className="text-primary font-medium">Workspace</span>
        <span>/</span>
        <span className="text-foreground">Forum</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-heading text-foreground leading-tight">
          My Forum Activity
        </h2>
        <p className="mt-2 text-muted-foreground max-w-2xl text-sm sm:text-base">
          Track the historical inquiries you have posted, and manage the questions you are actively investigating.
        </p>
      </header>

      {/* Content Area */}
      <div className="flex-1 rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Active Inquiries</h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-6">
          You haven't posted or claimed any inquiries yet. Head over to the Explore page to engage with the community.
        </p>
        <Link
          href="/explore"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          Go to Explore
        </Link>
      </div>
    </div>
  );
}

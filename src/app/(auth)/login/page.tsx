import Link from 'next/link';
import LoginForm from '@/src/features/auth/components/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sign in — Istifsar' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md">
      <div className="relative rounded-sm border-t border-l border-b-2 border-r-2 border-t-white border-l-white border-b-foreground/15 border-r-foreground/15 bg-card px-5 py-6 shadow-[4px_4px_0px_0px_hsl(var(--card)),_4px_4px_0px_1px_hsl(var(--border)),_8px_8px_0px_0px_hsl(var(--card)),_8px_8px_0px_1px_hsl(var(--border)),_0_12px_24px_rgba(0,0,0,0.06)] sm:px-10 sm:py-10">
        <div className="mb-8 space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-heading tracking-wide text-primary sm:text-3xl font-bold">
              استفسار
            </h1>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-primary sm:size-6"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>

          <h2 className="text-lg font-heading font-medium text-foreground sm:text-xl">
            Welcome to the Archive
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to explore history through authentic sources.
          </p>
        </div>

        {error === 'auth_callback_failed' && (
          <div className="mb-5 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            Authentication failed. Please try signing in again.
          </div>
        )}

        <LoginForm />

        <div className="mt-5 flex items-center justify-center gap-2 text-xs sm:text-sm">
          <Link
            href="/forgot-password"
            className="text-primary/70 underline underline-offset-4 transition-colors hover:text-primary"
          >
            Forgot password?
          </Link>
          <span className="text-muted-foreground/30 select-none">·</span>
          <Link
            href="/"
            className="text-primary/70 underline underline-offset-4 transition-colors hover:text-primary"
          >
            Landing Page
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Istifsar?{' '}
        <Link
          href="/signup"
          className="text-primary/80 underline underline-offset-4 transition-colors hover:text-primary font-medium"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}

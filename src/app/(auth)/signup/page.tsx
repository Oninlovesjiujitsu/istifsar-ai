import Link from 'next/link';
import SignUpForm from '@/src/features/auth/components/SignUpForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create account — Istifsar' };

export default function SignUpPage() {
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
            Join the Archive
          </h2>
          <p className="text-sm text-muted-foreground">
            Create a free account to start exploring history through primary sources.
          </p>
        </div>

        <SignUpForm />

      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary/80 underline underline-offset-4 transition-colors hover:text-primary font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

import Link from 'next/link';
import ForgotPasswordForm from '@/src/features/auth/components/ForgotPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Forgot password — Istifsar' };

export default function ForgotPasswordPage() {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md">
      <div className="relative rounded-sm border-t border-l border-b-2 border-r-2 border-t-white border-l-white border-b-foreground/15 border-r-foreground/15 bg-card px-5 py-6 shadow-[4px_4px_0px_0px_hsl(var(--card)),_4px_4px_0px_1px_hsl(var(--border)),_8px_8px_0px_0px_hsl(var(--card)),_8px_8px_0px_1px_hsl(var(--border)),_0_12px_24px_rgba(0,0,0,0.06)] sm:px-10 sm:py-10">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-xl font-heading font-semibold tracking-wide text-primary sm:text-2xl">
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
        <Link
          href="/login"
          className="text-primary/80 underline underline-offset-4 transition-colors hover:text-primary font-medium"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

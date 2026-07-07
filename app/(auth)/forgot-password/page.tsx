import Link from 'next/link';
import ForgotPasswordForm from '@/app/components/auth/ForgotPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Forgot password — Istifsar' };

export default function ForgotPasswordPage() {
  return (
    <div className="relative mx-auto w-full max-w-sm sm:max-w-md">
      <div
        className="pointer-events-none absolute -inset-10 -top-16 sm:-inset-14 sm:-top-20"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(160,120,40,0.18) 0%, rgba(120,90,30,0.08) 40%, transparent 70%)',
        }}
      />

      <div className="relative rounded-2xl border border-[#a08430]/15 bg-[#1a1720]/90 px-6 py-8 shadow-2xl shadow-[#a08430]/5 backdrop-blur-sm sm:px-10 sm:py-10">
        <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-[#b8963f]/50 to-transparent sm:inset-x-10" />

        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-wide text-amber-200/90 sm:text-2xl">
            Reset your password
          </h1>
          <p className="text-sm text-neutral-400">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500 flex items-center justify-center gap-2">
        <Link
          href="/login"
          className="text-amber-300/70 underline-offset-4 transition-colors hover:text-amber-200 hover:underline"
        >
          Back to sign in
        </Link>
        <span className="text-neutral-600 select-none">·</span>
      </p>
    </div>
  );
}

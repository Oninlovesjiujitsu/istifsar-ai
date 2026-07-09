import Link from 'next/link';
import SignUpForm from '@/src/components/auth/SignUpForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Create account — Istifsar' };

export default function SignUpPage() {
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
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-semibold tracking-wide text-amber-200/90 sm:text-3xl">
              استفسار
            </h1>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5 text-amber-200/70 sm:size-6"
            >
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>

          <h2 className="text-lg font-medium text-amber-100/80 sm:text-xl">
            Join the Archive
          </h2>
          <p className="text-sm text-neutral-400">
            Create a free account to start exploring history through primary sources.
          </p>
        </div>

        <SignUpForm />

      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-amber-300/70 underline-offset-4 transition-colors hover:text-amber-200 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Set new password — Istifsar' };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="dark relative flex min-h-svh items-center justify-center bg-[#0e0d10] px-4 py-12">
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
              Set new password
            </h1>
            <p className="text-sm text-neutral-400">
              Choose a new password for your account.
            </p>
          </div>

          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}

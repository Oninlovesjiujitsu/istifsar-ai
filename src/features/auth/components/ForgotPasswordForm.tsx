'use client';

import { useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-sm text-neutral-300">
          If an account exists for{' '}
          <span className="text-amber-200/90">{email}</span>, you&apos;ll
          receive a password reset link shortly.
        </p>
        <p className="text-xs text-neutral-500">
          Check your spam folder if you don&apos;t see it.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="block w-full rounded-lg border border-white/[0.08] bg-[#111014] px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 transition-colors focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full border border-[#a08430]/40 bg-[#b8963f] px-4 py-2.5 text-sm font-semibold text-[#1a1210] shadow-lg shadow-black/30 transition-all hover:bg-[#c9a64a] focus:outline-none focus:ring-2 focus:ring-[#b8963f]/30 focus:ring-offset-2 focus:ring-offset-[#1a1720] active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? 'Sending\u2026' : 'Send reset link'}
      </button>
    </form>
  );
}

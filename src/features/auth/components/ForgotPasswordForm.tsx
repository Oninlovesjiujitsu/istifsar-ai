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
        <p className="text-sm text-muted-foreground">
          If an account exists for{' '}
          <span className="font-medium text-foreground">{email}</span>, you&apos;ll
          receive a password reset link shortly.
        </p>
        <p className="text-xs text-muted-foreground/60 font-serif italic">
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
          className="block w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
        />
      </div>

      {error && (
        <p className="rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-sm bg-primary text-primary-foreground font-semibold px-4 py-2.5 text-sm uppercase tracking-widest border-t border-l border-t-white/20 border-l-white/20 border-b-2 border-r-2 border-b-black/30 border-r-black/30 shadow-[1px_1px_3px_rgba(0,0,0,0.15)] hover:bg-foreground hover:text-background active:border-t-2 active:border-l-2 active:border-b active:border-r active:border-t-black/30 active:border-l-black/30 active:border-b-white/20 active:border-r-white/20 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100 disabled:pointer-events-none disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  );
}

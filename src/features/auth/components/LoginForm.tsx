'use client';

import { useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      let role = (data.session?.user.app_metadata?.role as string) ?? 'reader';

      // Fallback: if the JWT hook hasn't synced the role, query profiles directly
      if (role === 'reader' && data.session?.user.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single();
          if (profile?.role) role = profile.role;
        } catch {
          // use JWT role as-is
        }
      }

      if (role === 'admin') {
        window.location.href = '/admin';
      } else if (role === 'verified_historian') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/explore';
      }
    }
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

      <div className="relative">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="block w-full rounded-lg border border-white/[0.08] bg-[#111014] pl-4 pr-11 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 transition-colors focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 focus:outline-none transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="size-4 text-neutral-400" />
          ) : (
            <Eye className="size-4 text-neutral-400" />
          )}
        </button>
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
        {loading ? 'Signing in\u2026' : 'Sign in'}
      </button>
    </form>
  );
}

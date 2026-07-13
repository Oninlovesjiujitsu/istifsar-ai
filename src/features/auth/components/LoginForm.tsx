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
          className="block w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
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
          className="block w-full rounded-sm border border-border bg-background pl-4 pr-11 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="size-4 text-muted-foreground" />
          ) : (
            <Eye className="size-4 text-muted-foreground" />
          )}
        </button>
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
        {loading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}

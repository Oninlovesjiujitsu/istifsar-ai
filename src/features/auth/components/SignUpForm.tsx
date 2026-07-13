'use client';

import { useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { signUpHistorian } from '@/src/features/auth/actions';
import { Eye, EyeOff } from 'lucide-react';

type Role = 'enthusiast' | 'historian';
type Step = 'role' | 'details' | 'done';

const ROLE_CARDS: Array<{
  value: Role;
  title: string;
  description: string;
}> = [
    {
      value: 'enthusiast',
      title: 'History Enthusiast',
      description:
        'Students, curious readers, and history buffs',
    },
    {
      value: 'historian',
      title: 'Historian',
      description:
        'Academics, researchers, and independent historians',
    },
  ];

const inputClasses =
  'block w-full rounded-sm border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 transition-colors shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50';

export default function SignUpForm() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [scholarUrl, setScholarUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  function selectRole(r: Role) {
    setRole(r);
    setStep('details');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (role === 'historian') {
        await signUpHistorian(displayName, email, password, scholarUrl);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim(),
              role_preference: role,
            },
            emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/explore`,
          },
        });
        if (error) throw error;
      }

      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="space-y-4 py-4 text-center">
        <div className="space-y-1">
          {role === 'historian' ? (
            <>
              <p className="text-lg font-heading font-semibold text-foreground">Account created</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                You can sign in now with your email and password.
                Your Google Scholar profile has been submitted for verification —
                an admin will review it and grant you Contributor access.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-heading font-semibold text-foreground">Almost there</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
                <br />
                Verify your email, then sign in to start exploring.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  if (step === 'role') {
    return (
      <div className="space-y-4">
        <div className="space-y-3">
          {ROLE_CARDS.map((card) => (
            <button
              key={card.value}
              type="button"
              onClick={() => selectRole(card.value)}
              className="group w-full rounded-sm border border-border bg-card p-4 sm:p-5 text-left transition-all hover:border-primary/35 hover:bg-primary/5 focus:outline-none focus:ring-1 focus:ring-primary/20 shadow-sm"
            >
              <div className="space-y-1">
                <p className="font-semibold text-foreground transition-colors group-hover:text-primary">
                  {card.title}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {card.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary/10 px-3 py-1 text-xs font-medium text-primary border border-primary/20">
          {role === 'enthusiast' ? 'History enthusiast' : 'Academic Historian'}
        </span>
        <button
          type="button"
          onClick={() => { setStep('role'); setError(null); }}
          className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-primary hover:underline"
        >
          Change
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="display-name" className="block text-sm font-medium text-muted-foreground">
            Your name
          </label>
          <input
            id="display-name"
            type="text"
            required
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Maria Santos"
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="block text-sm font-medium text-muted-foreground">
            Email address
          </label>
          <input
            id="signup-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClasses}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="block text-sm font-medium text-muted-foreground">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
        </div>

        {role === 'historian' && (
          <div className="space-y-1.5">
            <label htmlFor="scholar-url" className="block text-sm font-medium text-muted-foreground">
              Google Scholar profile
            </label>
            <input
              id="scholar-url"
              type="url"
              required
              value={scholarUrl}
              onChange={(e) => setScholarUrl(e.target.value)}
              placeholder="https://scholar.google.com/citations?user=..."
              className={inputClasses}
            />
            <p className="text-xs text-muted-foreground">
              An admin will review your profile to verify your credentials
              and grant Contributor access.
            </p>
          </div>
        )}

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
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

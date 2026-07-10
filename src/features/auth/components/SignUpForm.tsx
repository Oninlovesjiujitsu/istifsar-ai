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
  'block w-full rounded-lg border border-white/[0.08] bg-[#111014] px-4 py-2.5 text-sm text-neutral-200 placeholder:text-neutral-500 transition-colors focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/10';

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
              <p className="text-lg font-semibold text-neutral-100">Account created</p>
              <p className="text-sm leading-relaxed text-neutral-400">
                You can sign in now with your email and password.
                Your Google Scholar profile has been submitted for verification —
                an admin will review it and grant you Contributor access.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-neutral-100">Almost there</p>
              <p className="text-sm leading-relaxed text-neutral-400">
                We sent a verification link to <span className="font-medium text-neutral-200">{email}</span>.
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
              className="group w-full rounded-xl border border-white/[0.06] bg-[#111014] p-5 text-left transition-all hover:border-amber-500/30 hover:bg-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <div className="space-y-1">
                <p className="font-semibold text-neutral-100 transition-colors group-hover:text-amber-200">
                  {card.title}
                </p>
                <p className="text-sm leading-relaxed text-neutral-400">
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
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
          {role === 'enthusiast' ? 'History enthusiast' : 'Academic Historian'}
        </span>
        <button
          type="button"
          onClick={() => { setStep('role'); setError(null); }}
          className="text-xs text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-300 hover:underline"
        >
          Change
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="display-name" className="block text-sm font-medium text-neutral-300">
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
          <label htmlFor="signup-email" className="block text-sm font-medium text-neutral-300">
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
          <label htmlFor="signup-password" className="block text-sm font-medium text-neutral-300">
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
        </div>

        {role === 'historian' && (
          <div className="space-y-1.5">
            <label htmlFor="scholar-url" className="block text-sm font-medium text-neutral-300">
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
            <p className="text-xs text-neutral-500">
              An admin will review your profile to verify your credentials
              and grant Contributor access.
            </p>
          </div>
        )}

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
          {loading ? 'Creating account\u2026' : 'Create account'}
        </button>
      </form>
    </div>
  );
}

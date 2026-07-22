'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  Mail01Icon,
  Tick02Icon,
  AlertCircleIcon,
  BookOpen02Icon,
  UserEdit01Icon,
} from '@hugeicons/core-free-icons';
import { updatePasswordAction } from '@/src/features/settings/actions/settingsActions';
import SignOutButton from '@/src/components/layout/SignOutButton';

interface SecurityTabProps {
  email: string | undefined;
  role: string | null;
}

export default function SecurityTab({ email, role }: SecurityTabProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const isHistorian = role === 'historian' || role === 'verified_historian';
  const roleDisplay = role?.replace(/_/g, ' ') ?? 'history reader';

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    if (newPassword !== confirmPassword) {
      setSaving(false);
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setSaving(false);
      setError('Password must be at least 8 characters long');
      return;
    }

    const res = await updatePasswordAction(newPassword);
    setSaving(false);

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 4000);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm leading-relaxed">
          <HugeiconsIcon icon={Tick02Icon} size={18} className="shrink-0" />
          <span>Password updated successfully!</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm leading-relaxed">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Account Info & Status Card */}
      <div className="p-4 sm:p-6 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-5 sm:space-y-6">
        <div className="flex items-start sm:items-center gap-3 border-b border-border pb-3.5 sm:pb-4">
          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <HugeiconsIcon icon={Shield01Icon} size={20} className="sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight leading-snug">
              Account Status & Security
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Manage your credentials, role privileges, and active session.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
          {/* Email Address */}
          <div className="p-3.5 sm:p-4 rounded-lg border border-border/60 bg-background/50 flex items-center gap-3.5 sm:gap-4 min-w-0 w-full">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
              <HugeiconsIcon icon={Mail01Icon} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                Email Address
              </p>
              <p className="text-xs sm:text-sm font-serif text-foreground break-all leading-normal">{email ?? '—'}</p>
            </div>
          </div>

          {/* Role Status */}
          <div className="p-3.5 sm:p-4 rounded-lg border border-border/60 bg-background/50 flex items-center gap-3.5 sm:gap-4 min-w-0 w-full">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0">
              {isHistorian ? (
                <HugeiconsIcon icon={Shield01Icon} size={20} />
              ) : (
                <HugeiconsIcon icon={BookOpen02Icon} size={20} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                Current Role
              </p>
              <div className="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-2.5 py-0.5 rounded text-[11px] sm:text-xs font-semibold uppercase tracking-wide">
                <span className="truncate">{roleDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handlePasswordUpdate} className="pt-4 border-t border-border space-y-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
            <HugeiconsIcon icon={Shield01Icon} size={18} className="text-primary shrink-0" />
            <span>Update Password</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs text-muted-foreground font-medium">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-md border border-input bg-background/80 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all leading-normal"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] sm:text-xs text-muted-foreground font-medium">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-md border border-input bg-background/80 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all leading-normal"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving || !newPassword}
              className="w-full sm:w-auto px-5 py-2.5 sm:py-2 rounded-md bg-primary text-primary-foreground font-medium text-xs uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {saving ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Session & Sign Out Card */}
      <div className="p-4 sm:p-6 rounded-xl border border-border bg-card/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
            <HugeiconsIcon icon={Shield01Icon} size={18} className="text-primary shrink-0" />
            <span>Active Session</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Sign out of your active session on this device.
          </p>
        </div>
        <SignOutButton className="w-full sm:w-auto px-5 py-2.5 rounded-md border border-border text-foreground text-xs font-medium uppercase tracking-wider hover:bg-accent transition-all shrink-0">
          Sign Out
        </SignOutButton>
      </div>
    </div>
  );
}

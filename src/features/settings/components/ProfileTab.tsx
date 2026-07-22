'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserCircle02Icon,
  Building02Icon,
  UserEdit01Icon,
  Tick02Icon,
  AlertCircleIcon,
} from '@hugeicons/core-free-icons';
import { updateFullProfile } from '@/src/features/profile/actions/profile';

interface ProfileData {
  display_name: string | null;
  username: string | null;
  bio: string | null;
  institution: string | null;
  avatar_url: string | null;
}

export default function ProfileTab({ profile }: { profile: ProfileData | null }) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [institution, setInstitution] = useState(profile?.institution ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? '');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    const res = await updateFullProfile({
      displayName,
      username,
      bio,
      institution,
      avatarUrl,
    });

    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm leading-relaxed">
          <HugeiconsIcon icon={Tick02Icon} size={18} className="shrink-0" />
          <span>Profile details saved successfully!</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm leading-relaxed">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-4 sm:p-6 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 border-b border-border pb-5 sm:pb-6">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-primary/30 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <HugeiconsIcon icon={UserCircle02Icon} size={36} className="text-primary" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0 w-full">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground tracking-tight break-words leading-tight">
              {displayName || 'Scholar Name'}
            </h3>
            <p className="text-primary text-xs sm:text-sm font-serif italic break-all mt-0.5">
              @{username || 'username'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Update your public identity across the Istifsar archive & workspace.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Display Name */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <HugeiconsIcon icon={UserEdit01Icon} size={14} className="text-primary shrink-0" />
              <span>Display Name</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Dr. Teodoro Agoncillo"
              className="w-full rounded-md border border-input bg-background/80 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all leading-normal"
            />
          </div>

          {/* Username */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <HugeiconsIcon icon={UserCircle02Icon} size={14} className="text-primary shrink-0" />
              <span>Username</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2 sm:top-2.5 text-xs sm:text-sm text-muted-foreground">@</span>
              <input
                type="text"
                required
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="agoncillo"
                className="w-full rounded-md border border-input bg-background/80 pl-8 pr-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all leading-normal"
              />
            </div>
          </div>

          {/* Institution */}
          <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
            <label className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <HugeiconsIcon icon={Building02Icon} size={14} className="text-primary shrink-0" />
              <span>Institution / University Affiliation</span>
            </label>
            <input
              type="text"
              maxLength={150}
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="e.g. University of the Philippines, Department of History"
              className="w-full rounded-md border border-input bg-background/80 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all leading-normal"
            />
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
            <label className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
              <HugeiconsIcon icon={UserEdit01Icon} size={14} className="text-primary shrink-0" />
              <span>Avatar Image URL</span>
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-md border border-input bg-background/80 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all leading-normal break-all"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1.5">
                <HugeiconsIcon icon={UserEdit01Icon} size={14} className="text-primary shrink-0" />
                <span>Historiographical Bio</span>
              </label>
              <span className="text-[10px] sm:text-xs text-muted-foreground/70">{bio.length}/500</span>
            </div>
            <textarea
              rows={4}
              maxLength={500}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share your primary historical interests, ongoing research, or archival focus..."
              className="w-full rounded-md border border-input bg-background/80 px-3.5 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-xs sm:text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm uppercase sm:normal-case tracking-wider sm:tracking-normal"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Details'}
          </button>
        </div>
      </div>
    </form>
  );
}

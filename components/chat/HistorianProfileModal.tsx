'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getHistorianProfile, type HistorianProfile } from '@/actions/historian-profile';
import { ROLE_LABELS } from '@/lib/ui/role-labels';

type Props = {
  username: string;
  onClose: () => void;
};

function avatarColor(name: string): string {
  const colors = [
    'bg-amber-900/60 text-amber-300',
    'bg-rose-900/60 text-rose-300',
    'bg-emerald-900/60 text-emerald-300',
    'bg-sky-900/60 text-sky-300',
    'bg-violet-900/60 text-violet-300',
    'bg-orange-900/60 text-orange-300',
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

export default function HistorianProfileModal({ username, onClose }: Props) {
  const [profile, setProfile] = useState<HistorianProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getHistorianProfile(username).then((data) => {
      if (!cancelled) {
        setProfile(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === backdropRef.current) onClose();
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Profile of ${username}`}
    >
      <div className="w-full max-w-md bg-surface-vault border border-white/[0.08] rounded-sm shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-surface-elevated border-b border-white/[0.06]">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold">
            Historian Profile
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted-vault hover:text-gold transition-colors"
            aria-label="Close profile"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 rounded-full bg-gold animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-gold animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-gold animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          )}

          {!loading && !profile && (
            <p className="text-center text-text-muted-vault text-sm py-10">
              Profile not found.
            </p>
          )}

          {!loading && profile && (
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold ${avatarColor(profile.displayName)}`}
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.displayName}
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    profile.displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-heading text-white text-lg font-bold leading-tight">
                    {profile.displayName}
                  </h3>
                  <p className="text-xs text-text-muted-vault mt-0.5">@{profile.username}</p>
                  <span className="inline-flex items-center mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gold/10 text-gold border border-gold/20">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </span>
                </div>
              </div>

              {profile.institution && (
                <div>
                  <div className="text-[10px] text-text-muted-vault uppercase mb-1">Institution</div>
                  <div className="text-sm text-zinc-300">{profile.institution}</div>
                </div>
              )}

              {profile.bio && (
                <div>
                  <div className="text-[10px] text-text-muted-vault uppercase mb-1">Biography</div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-4 gap-3 pt-2">
                <div className="text-center">
                  <div className="font-heading text-gold text-lg font-bold">{profile.publicationCount}</div>
                  <div className="text-[10px] text-text-muted-vault uppercase">Sources</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-gold text-lg font-bold">{profile.essayCount}</div>
                  <div className="text-[10px] text-text-muted-vault uppercase">Essays</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-gold text-lg font-bold">{profile.citationCount}</div>
                  <div className="text-[10px] text-text-muted-vault uppercase">Citations</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-gold text-lg font-bold">
                    {new Date(profile.joinedAt).getFullYear()}
                  </div>
                  <div className="text-[10px] text-text-muted-vault uppercase">Joined</div>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06]">
                <Link
                  href={`/profile/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:translate-x-1 transition-transform"
                >
                  View Full Profile
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

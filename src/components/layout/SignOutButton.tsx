'use client';

import { useState, useTransition } from 'react';
import { signOut } from '@/src/features/auth/actions';

interface SignOutButtonProps {
  className?: string;
  requireConfirm?: boolean;
  children?: React.ReactNode;
}

export default function SignOutButton({
  className,
  requireConfirm = true,
  children,
}: SignOutButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function handleSignOut() {
    startTransition(async () => {
      await signOut();
    });
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (requireConfirm && !confirmOpen) {
      setConfirmOpen(true);
      return;
    }
    handleSignOut();
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isPending}
        className={className ?? 'text-sm hover:text-foreground transition-colors disabled:opacity-50'}
      >
        {isPending ? 'Signing out…' : (children ?? 'Sign out')}
      </button>

      {/* Sign Out Confirmation Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl space-y-4 text-left font-serif"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1.5">
              <h4 className="text-base font-semibold text-foreground tracking-tight">
                Sign Out Confirmation
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to sign out of your active Istifsar session?
              </p>
            </div>
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-md border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSignOut}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-destructive text-destructive-foreground text-xs font-medium uppercase tracking-wider hover:bg-destructive/90 transition-all disabled:opacity-50 shadow-sm text-center"
              >
                {isPending ? 'Signing out…' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

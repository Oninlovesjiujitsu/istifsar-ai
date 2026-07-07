'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { SidebarLabel } from '@/app/components/layout/SidebarShell';

export default function ThemePicker({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (showLabel) {
      return (
        <div className="flex items-center gap-3 px-3 py-2 text-text-muted-vault text-sm font-serif">
          <div className="w-[18px] h-[18px] rounded bg-zinc-200/20 dark:bg-zinc-800/20 border border-zinc-200/30 dark:border-zinc-800/30 animate-pulse" />
          <SidebarLabel>Theme</SidebarLabel>
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-xl bg-zinc-200/20 dark:bg-zinc-800/20 border border-zinc-200/30 dark:border-zinc-800/30 animate-pulse" />
    );
  }

  const isDark = resolvedTheme === 'dark';

  if (showLabel) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="flex items-center gap-3 px-3 py-2 text-text-muted-vault hover:text-gold hover:bg-foreground/[0.04] transition-colors rounded-sm text-sm font-serif w-full text-left cursor-pointer"
        aria-label="Toggle Theme"
      >
        <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
          {isDark ? (
            <Sun className="w-[18px] h-[18px] text-amber-400 transition-transform duration-500 rotate-0 scale-100 hover:rotate-45" />
          ) : (
            <Moon className="w-[18px] h-[18px] text-indigo-600 transition-transform duration-500 rotate-0 scale-100 hover:-rotate-12" />
          )}
        </div>
        <SidebarLabel>{isDark ? 'Light Mode' : 'Dark Mode'}</SidebarLabel>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 glass-card border border-white/20 dark:border-white/5 bg-white/20 dark:bg-white/5 hover:bg-white/40 dark:hover:bg-white/10 active:scale-95 shadow-sm text-foreground focus:outline-none cursor-pointer"
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 transition-transform duration-500 rotate-0 scale-100 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600 transition-transform duration-500 rotate-0 scale-100 hover:-rotate-12" />
      )}
    </button>
  );
}

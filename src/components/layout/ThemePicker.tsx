'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useSidebar, SidebarLabel } from '@/src/components/layout/SidebarShell';

export default function ThemePicker({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { expanded } = useSidebar();

  // Avoid hydration mismatch by waiting for mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (showLabel) {
      return (
        <div className="w-full h-[44px] rounded-sm bg-zinc-200/10 dark:bg-zinc-800/10 animate-pulse" />
      );
    }
    return (
      <div className="w-9 h-9 rounded-lg bg-zinc-200/20 dark:bg-zinc-800/20 border border-zinc-200/30 dark:border-zinc-800/30 animate-pulse" />
    );
  }

  const isDark = theme === 'summer-night';

  if (showLabel) {
    return (
      <button
        onClick={() => setTheme(isDark ? 'summer-morning' : 'summer-night')}
        className={[
          'px-3 py-3 transition-colors flex items-center font-serif text-sm tracking-tight rounded-sm w-full text-left',
          'text-text-muted-vault hover:text-foreground hover:bg-foreground/[0.04] focus:outline-none cursor-pointer',
          expanded ? 'gap-3' : 'lg:justify-center gap-3',
        ].join(' ')}
        aria-label="Toggle Theme"
      >
        <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center">
          {isDark ? (
            <Moon className="w-[18px] h-[18px] text-indigo-400 transition-transform duration-500 hover:-rotate-12" />
          ) : (
            <Sun className="w-[18px] h-[18px] text-amber-500 transition-transform duration-500 hover:rotate-45" />
          )}
        </div>
        <SidebarLabel>
          {isDark ? 'Summer Night' : 'Summer Morning'}
        </SidebarLabel>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(isDark ? 'summer-morning' : 'summer-night')}
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


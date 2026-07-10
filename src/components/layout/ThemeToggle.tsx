'use client';

// import { useTheme } from 'next-themes';
// import { useState, useEffect } from 'react';
// import { motion, AnimatePresence } from 'motion/react';
// import { SidebarLabel } from './SidebarShell';

export default function ThemeToggle({ showLabel = false }: { showLabel?: boolean }) {
  // Commented out for now to disable theme selection and keep dark theme by default.
  return null;

  /*
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-9 h-9 shrink-0" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-3 px-3 py-2 text-text-muted-vault hover:text-gold hover:bg-foreground/[0.04] transition-colors rounded-sm text-sm font-serif"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="w-[18px] h-[18px] shrink-0 relative flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.svg
              key="moon"
              className="w-[18px] h-[18px] absolute"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </motion.svg>
          ) : (
            <motion.svg
              key="sun"
              className="w-[18px] h-[18px] absolute"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </div>
      {showLabel && <SidebarLabel>{isDark ? 'Light Mode' : 'Dark Mode'}</SidebarLabel>}
    </button>
  );
  */
}

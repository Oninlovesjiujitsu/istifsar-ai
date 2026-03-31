'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

type SidebarContextValue = {
  expanded: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextValue>({
  expanded: true,
  toggle: () => {},
  close: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

/**
 * Root wrapper that provides sidebar state to both the sidebar panel and the
 * main content area. Renders the mobile top bar, backdrop, and sidebar
 * <aside>.
 *
 * Usage (in a layout):
 *   <SidebarShell sidebar={<ReaderSidebarContent ... />}>
 *     {children}   ← main page content
 *   </SidebarShell>
 */
export default function SidebarShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => {
    if (window.innerWidth < 1024) {
      setMobileOpen((prev) => !prev);
    } else {
      setExpanded((prev) => !prev);
    }
  }, []);

  const close = useCallback(() => {
    setMobileOpen(false);
  }, []);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  /* Close mobile drawer on resize to desktop */
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ expanded, toggle, close }}>
      <div className="flex min-h-screen">
        {/* ── Mobile backdrop ───────────────────────────────────────────── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={close}
            aria-hidden="true"
          />
        )}

        {/* ── Sidebar panel ────────────────────────────────────────────── */}
        <aside
          className={[
            'fixed top-0 left-0 z-50 h-screen bg-surface-vault border-r border-white/[0.06]',
            'shadow-[0_0_15px_rgba(212,175,55,0.08)] flex flex-col py-6 gap-6',
            'transition-all duration-300 ease-in-out overflow-hidden',
            expanded ? 'lg:w-64' : 'lg:w-16',
            mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0',
          ].join(' ')}
        >
          {sidebar}
        </aside>

        {/* ── Mobile top bar ────────────────────────────────────────────── */}
        <div className="fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 bg-surface-vault/95 backdrop-blur-sm border-b border-white/[0.06] lg:hidden">
          <button
            type="button"
            onClick={toggle}
            className="w-10 h-10 flex items-center justify-center text-gold"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* ── Main content area ─────────────────────────────────────────── */}
        <div
          className={[
            'flex-1 bg-background relative overflow-hidden transition-[margin] duration-300 ease-in-out',
            /* Mobile: full width with top padding for the fixed bar */
            'pt-14 lg:pt-0',
            /* Desktop: margin matches sidebar width */
            expanded ? 'lg:ml-64' : 'lg:ml-16',
          ].join(' ')}
        >
          {/* Ambient gold glow */}
          <div className="pointer-events-none absolute top-0 right-0 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03)_0%,transparent_70%)]" />
          {children}
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

/* ── Toggle button for desktop (sits inside the sidebar) ─────────────── */

export function SidebarToggle() {
  const { expanded, toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className="hidden lg:flex w-8 h-8 items-center justify-center rounded-sm text-text-muted-vault hover:text-gold hover:bg-white/[0.04] transition-colors shrink-0"
      aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
    >
      <svg
        className={`w-4 h-4 transition-transform duration-300 ${expanded ? '' : 'rotate-180'}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
      </svg>
    </button>
  );
}

/* ── Helper: hides children when sidebar is collapsed on desktop ─────── */

export function SidebarLabel({ children }: { children: React.ReactNode }) {
  const { expanded } = useSidebar();

  return (
    <span
      className={[
        'transition-all duration-300 whitespace-nowrap overflow-hidden',
        expanded ? 'opacity-100 w-auto' : 'lg:opacity-0 lg:w-0',
      ].join(' ')}
    >
      {children}
    </span>
  );
}

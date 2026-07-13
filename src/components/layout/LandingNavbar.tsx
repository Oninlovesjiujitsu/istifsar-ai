'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import SignOutButton from '@/src/components/layout/SignOutButton';
// import ThemePicker from '@/src/components/layout/ThemePicker';
import { HugeiconsIcon } from '@hugeicons/react';
import { QuillWrite01Icon } from '@hugeicons/core-free-icons';
import { AnimatePresence, motion } from 'motion/react';

const navSections = ['collections', 'agoncillo', 'boundaries', 'historians'] as const;
type SectionId = (typeof navSections)[number];

const navItems = [
  { id: 'collections', name: 'Digital Collections' },
  { id: 'agoncillo', name: 'The Agoncillo Constraint' },
  { id: 'boundaries', name: 'Platform Boundaries' },
  { id: 'historians', name: 'For Historians' },
];

export default function LandingNavbar() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as SectionId);
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px' },
    );

    for (const id of navSections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleScrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string, closeMenu = false) => {
    e.preventDefault();
    if (closeMenu) {
      setMobileMenuOpen(false);
      document.body.style.overflow = '';
    }

    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, closeMenu ? 150 : 0);
  }, []);

  const navLinkClass = (id: SectionId) =>
    activeSection === id
      ? 'font-serif font-semibold text-xs md:text-sm tracking-tight text-primary border-b-2 border-primary pb-1 transition-all duration-300'
      : 'font-serif font-semibold text-xs md:text-sm tracking-tight text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-primary/40 pb-1 transition-all duration-300';

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-border/50 shadow-sm"
    >
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 md:py-6 max-w-[1440px] mx-auto">
        {/* Brand */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2 group"
        >
          <HugeiconsIcon
            icon={QuillWrite01Icon}
            size={24}
            className="text-primary group-hover:text-foreground transition-colors duration-300"
          />
          <span className="text-xl sm:text-2xl font-serif italic text-primary tracking-widest group-hover:text-foreground transition-colors duration-300">
            Istifsar AI
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-12 ml-auto">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={navLinkClass(item.id as SectionId)}
              onClick={(e) => handleScrollToSection(e, item.id)}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-6 ml-12">
          {!loading && role ? (
            <>
              <Link
                href={role === 'admin' ? '/admin' : role === 'verified_historian' ? '/dashboard' : '/explore'}
                className="inline-block text-center bg-primary text-primary-foreground px-6 py-2 rounded-sm text-sm uppercase tracking-widest hover:bg-foreground hover:text-background font-medium border-t border-l border-t-white/20 border-l-white/20 border-b-2 border-r-2 border-b-black/30 border-r-black/30 shadow-[1px_1px_3px_rgba(0,0,0,0.15)] active:border-t-2 active:border-l-2 active:border-b active:border-r active:border-t-black/30 active:border-l-black/30 active:border-b-white/20 active:border-r-white/20 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
              >
                Go to Workspace
              </Link>
              <div className="text-primary text-sm uppercase tracking-widest hover:text-foreground transition-colors">
                <SignOutButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-primary text-sm uppercase tracking-widest hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-block text-center bg-primary text-primary-foreground px-6 py-2 rounded-sm text-sm uppercase tracking-widest hover:bg-foreground hover:text-background font-medium border-t border-l border-t-white/20 border-l-white/20 border-b-2 border-r-2 border-b-black/30 border-r-black/30 shadow-[1px_1px_3px_rgba(0,0,0,0.15)] active:border-t-2 active:border-l-2 active:border-b active:border-r active:border-t-black/30 active:border-l-black/30 active:border-b-white/20 active:border-r-white/20 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
              >
                Join as Historian
              </Link>
            </>
          )}
          {/* <ThemePicker /> */}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-3">
          {/* <ThemePicker /> */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="relative w-10 h-10 flex items-center justify-center text-primary cursor-pointer hover:text-foreground transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
            <span
              className={`absolute h-[2px] w-5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-0' : '-translate-y-1.5'}`}
            />
            <span
              className={`absolute h-[2px] w-5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
            />
            <span
              className={`absolute h-[2px] w-5 bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 translate-y-0' : 'translate-y-1.5'}`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-md"
          >
            <div className="flex flex-col px-6 py-6 gap-6">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => handleScrollToSection(e, item.id, true)}
                  className="font-serif font-light tracking-tight text-muted-foreground hover:text-primary transition-colors text-lg"
                >
                  {item.name}
                </a>
              ))}

              <div className="h-px bg-border" />

              {!loading && role ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href={role === 'admin' ? '/admin' : role === 'verified_historian' ? '/dashboard' : '/explore'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-block text-center bg-primary text-primary-foreground px-6 py-3 rounded-sm text-sm uppercase tracking-widest font-medium border-t border-l border-t-white/20 border-l-white/20 border-b-2 border-r-2 border-b-black/30 border-r-black/30 shadow-[1px_1px_3px_rgba(0,0,0,0.15)] active:border-t-2 active:border-l-2 active:border-b active:border-r active:border-t-black/30 active:border-l-black/30 active:border-b-white/20 active:border-r-white/20 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
                  >
                    Go to Workspace
                  </Link>
                  <div className="text-primary text-sm uppercase tracking-widest hover:text-foreground transition-colors py-2 text-center">
                    <SignOutButton />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-primary text-sm uppercase tracking-widest hover:text-foreground transition-colors py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-block text-center bg-primary text-primary-foreground px-6 py-3 rounded-sm text-sm uppercase tracking-widest font-medium border-t border-l border-t-white/20 border-l-white/20 border-b-2 border-r-2 border-b-black/30 border-r-black/30 shadow-[1px_1px_3px_rgba(0,0,0,0.15)] active:border-t-2 active:border-l-2 active:border-b active:border-r active:border-t-black/30 active:border-l-black/30 active:border-b-white/20 active:border-r-white/20 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-100"
                  >
                    Join as Historian
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

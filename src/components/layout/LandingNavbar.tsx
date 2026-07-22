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

const navSections = ['pillars', 'agoncillo', 'personas', 'collections', 'boundaries'] as const;
type SectionId = (typeof navSections)[number];

const navItems = [
  { id: 'pillars', name: 'Capabilities' },
  { id: 'agoncillo', name: 'Agoncillo Principle' },
  { id: 'personas', name: 'Ecosystem' },
  { id: 'collections', name: 'Archive Vault' },
  { id: 'boundaries', name: 'Ethical Limits' },
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
      { rootMargin: '-15% 0px -65% 0px' },
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
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      if (closeMenu) {
        setMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, closeMenu ? 150 : 0);
    }
  }, []);

  const navLinkClass = (id: SectionId) =>
    activeSection === id
      ? 'text-xs uppercase tracking-widest font-semibold text-primary border-b-2 border-primary pb-1 transition-all duration-200'
      : 'text-xs uppercase tracking-widest font-medium text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-primary/40 pb-1 transition-all duration-200';

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border/60 shadow-sm"
    >
      <div className="flex justify-between items-center px-4 sm:px-6 md:px-10 py-4 max-w-[1440px] mx-auto">
        {/* Brand */}
        <a
          href="/"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2.5 group"
        >
          <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
            <HugeiconsIcon
              icon={QuillWrite01Icon}
              size={20}
            />
          </div>
          <span className="text-xl sm:text-2xl font-serif italic text-primary tracking-widest group-hover:text-foreground transition-colors duration-300">
            Istifsar AI
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center space-x-8 xl:space-x-10 ml-auto">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={pathname === '/' ? `#${item.id}` : `/#${item.id}`}
              className={navLinkClass(item.id as SectionId)}
              onClick={(e) => handleScrollToSection(e, item.id)}
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center space-x-5 ml-10">
          {!loading && role ? (
            <>
              <Link
                href={role === 'admin' ? '/admin' : role === 'verified_historian' ? '/dashboard' : '/explore'}
                className="inline-block text-center bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-xs uppercase tracking-widest font-semibold hover:bg-foreground hover:text-background shadow-sm transition-all duration-150"
              >
                Go to Workspace
              </Link>
              <div className="text-primary text-xs uppercase tracking-widest hover:text-foreground transition-colors font-medium">
                <SignOutButton />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground text-xs uppercase tracking-widest font-semibold hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-block text-center bg-primary text-primary-foreground px-5 py-2.5 rounded-md text-xs uppercase tracking-widest font-semibold hover:bg-foreground hover:text-background shadow-sm transition-all duration-150"
              >
                Join as Historian
              </Link>
            </>
          )}
        </div>

        {/* Mobile controls */}
        <div className="lg:hidden flex items-center gap-3">
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
            className="lg:hidden overflow-hidden border-t border-border bg-background/95 backdrop-blur-md"
          >
            <div className="flex flex-col px-6 py-6 gap-5">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={pathname === '/' ? `#${item.id}` : `/#${item.id}`}
                  onClick={(e) => handleScrollToSection(e, item.id, true)}
                  className="font-sans font-medium tracking-wider text-muted-foreground hover:text-primary transition-colors text-sm uppercase"
                >
                  {item.name}
                </a>
              ))}

              <div className="h-px bg-border/60" />

              {!loading && role ? (
                <div className="flex flex-col gap-3">
                  <Link
                    href={role === 'admin' ? '/admin' : role === 'verified_historian' ? '/dashboard' : '/explore'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-block text-center bg-primary text-primary-foreground px-6 py-3 rounded-md text-xs uppercase tracking-widest font-semibold shadow-sm"
                  >
                    Go to Workspace
                  </Link>
                  <div className="text-primary text-xs uppercase tracking-widest hover:text-foreground transition-colors py-2 text-center font-medium">
                    <SignOutButton />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-primary text-xs uppercase tracking-widest font-semibold hover:text-foreground transition-colors py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-block text-center bg-primary text-primary-foreground px-6 py-3 rounded-md text-xs uppercase tracking-widest font-semibold shadow-sm"
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

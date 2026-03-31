'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  BalanceScaleIcon,
  ChartBarIncreasingIcon,
  BookOpen02Icon,
  QuillWrite01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import ArchiveCatalog from '@/components/discovery/ArchiveCatalog';

const navSections = ['agoncillo', 'historians'] as const;
type SectionId = (typeof navSections)[number];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const viewport = { once: true, amount: 0.3 as const };

const valueProps: { icon: IconSvgElement; title: string; text: string }[] = [
  {
    icon: Shield01Icon,
    title: 'The Agoncillo Constraint',
    text: 'Our AI adheres to strict historiographical protocols, prioritizing primary source validation over speculative inference.',
  },
  {
    icon: BalanceScaleIcon,
    title: 'Nodes of Contention',
    text: 'Identify conflicting historical narratives instantly. Istifsar highlights discrepancies to facilitate critical debate.',
  },
  {
    icon: ChartBarIncreasingIcon,
    title: 'The Citation Economy',
    text: 'Every claim is backed by a verifiable digital thread, connecting synthesized insights directly to the original manuscript.',
  },
];

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  useEffect(() => {
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
  }, []);

  const navLinkClass = (id: SectionId) =>
    activeSection === id
      ? 'font-serif font-light tracking-tight text-gold-bright border-b-2 border-gold pb-1 transition-all duration-300'
      : 'font-serif font-light tracking-tight text-text-muted-vault hover:text-foreground hover:border-b-2 hover:border-gold/40 pb-1 transition-all duration-300';

  return (
    <div className="selection:bg-gold/30">
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-sm shadow-[0_0_15px_rgba(212,175,55,0.1)]"
      >
        <div className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 md:py-6 max-w-[1440px] mx-auto">
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
              className="text-gold group-hover:text-gold-bright transition-colors duration-300"
            />
            <span className="text-xl sm:text-2xl font-serif italic text-gold tracking-widest group-hover:text-gold-bright transition-colors duration-300">
              Istifsar AI
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-12">
            <a href="#agoncillo" className={navLinkClass('agoncillo')}>
              The Agoncillo Constraint
            </a>
            <a href="#historians" className={navLinkClass('historians')}>
              For Historians
            </a>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/login"
              className="text-gold text-sm uppercase tracking-widest hover:text-gold-bright transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="bg-gold text-background px-6 py-2 rounded-sm text-sm uppercase tracking-widest hover:scale-[1.02] transition-all duration-300 font-medium"
            >
              Join as Historian
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center text-gold"
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

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-t border-gold/10 bg-background/95 backdrop-blur-md"
            >
              <div className="flex flex-col px-6 py-6 gap-6">
                <a
                  href="#agoncillo"
                  onClick={closeMobileMenu}
                  className="font-serif font-light tracking-tight text-text-muted-vault hover:text-gold transition-colors text-lg"
                >
                  The Agoncillo Constraint
                </a>
                <a
                  href="#historians"
                  onClick={closeMobileMenu}
                  className="font-serif font-light tracking-tight text-text-muted-vault hover:text-gold transition-colors text-lg"
                >
                  For Historians
                </a>

                <div className="h-px bg-gold/10" />

                <div className="flex flex-col gap-3">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="text-gold text-sm uppercase tracking-widest hover:text-gold-bright transition-colors py-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
                    className="bg-gold text-background px-6 py-3 rounded-sm text-sm uppercase tracking-widest font-medium text-center hover:bg-gold-bright transition-colors"
                  >
                    Join as Historian
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main>
        <section className="relative min-h-screen flex items-center justify-center pt-20 md:pt-24 px-4 sm:px-6 md:px-8 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-gold/[0.03] via-background to-background" />
          </div>

          <div className="relative z-10 max-w-5xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-8xl text-gold leading-tight mb-6 sm:mb-8 tracking-tight"
            >
              Seek the Truth <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="italic font-light font-serif"
              >
                of the Past.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: 'easeOut' }}
              className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10 sm:mb-12 px-2"
            >
              An advanced analytical engine designed for the rigorous demands of
              historical scholarship. Transcending search to deliver synthesized
              truth.
            </motion.p>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              transition={{ delayChildren: 1.2 }}
              className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-16 items-center opacity-40"
            >
              {['Curated Archives', 'Verified Sources', 'Scholarly Nodes'].map(
                (label) => (
                  <motion.span
                    key={label}
                    variants={fadeUp}
                    transition={{ duration: 0.5 }}
                    className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]"
                  >
                    {label}
                  </motion.span>
                ),
              )}
            </motion.div>
          </div>
        </section>

        <ArchiveCatalog />

        <section id="agoncillo" className="bg-surface-vault py-16 sm:py-24 md:py-32 px-4 sm:px-6 md:px-12">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-16 md:gap-24"
          >
            {valueProps.map((prop) => (
              <motion.div
                key={prop.title}
                variants={fadeUp}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-start"
              >
                <div className="bg-card p-3 sm:p-4 rounded-sm mb-5 sm:mb-8">
                  <HugeiconsIcon icon={prop.icon} size={28} className="text-gold" />
                </div>
                <h4 className="font-heading text-lg sm:text-xl text-foreground mb-3 sm:mb-4">
                  {prop.title}
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{prop.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <section
          id="historians"
          className="py-20 sm:py-28 md:py-40 text-center max-w-4xl mx-auto px-4 sm:px-6 md:px-8"
        >
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground mb-8 sm:mb-12"
          >
            History is not just preserved; it is understood.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
            className="text-muted-foreground mb-10 sm:mb-16 text-sm sm:text-base md:text-lg leading-relaxed"
          >
            Access to the Istifsar engine is currently by institutional
            invitation. We invite historians to help us curate the future of our
            shared past.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
          >
            <Link
              href="/signup"
              className="inline-flex items-center bg-transparent border border-gold text-gold px-6 sm:px-8 md:px-12 py-3 sm:py-4 md:py-5 rounded-sm uppercase tracking-widest text-xs sm:text-sm hover:bg-gold/5 transition-all group"
            >
              Apply for Researcher Access
              <HugeiconsIcon
                icon={BookOpen02Icon}
                size={20}
                className="ml-3 sm:ml-4 group-hover:translate-x-2 transition-transform duration-300"
              />
            </Link>
          </motion.div>
        </section>
      </main>

      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="w-full border-t border-border"
      >
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-16 py-8 md:py-12 w-full max-w-[1440px] mx-auto gap-6 md:gap-8">
          <p className="text-xs sm:text-sm tracking-widest uppercase text-text-muted-vault text-center md:text-left">
            &copy; 2026 Istifsar AI. All rights reserved. The Digital Curator.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-12">
            {['Archives', 'Methodology', 'Privacy Policy', 'Contact'].map(
              (label) => (
                <a
                  key={label}
                  href="#"
                  className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase text-text-muted-vault hover:text-gold transition-all opacity-80 hover:opacity-100"
                >
                  {label}
                </a>
              ),
            )}
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

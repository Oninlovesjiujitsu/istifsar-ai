'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import SignOutButton from '@/src/components/layout/SignOutButton';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  BalanceScaleIcon,
  ChartBarIncreasingIcon,
  BookOpen02Icon,
  QuillWrite01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import ContactModal from '@/src/components/contact/ContactModal';
import ArchiveCatalog from '@/src/components/archive/ArchiveCatalog';
import FireFlyBackground from '@/src/components/layout/FireFlyBackground';
import ArchiveBookshelfSilhouette from '@/src/components/layout/ArchiveBookshelfSilhouette';
import FloatingBackToTop from '@/src/components/layout/FloatingBackToTheTop';
import { ArrowDown } from 'lucide-react';
import { TypeAnimation } from 'react-type-animation';

const navSections = ['collections', 'agoncillo', 'boundaries', 'historians'] as const;
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

const AccordionItem = ({ title, text, defaultOpen = false }: { title: string; text: string; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <motion.div variants={fadeUp} className="border border-gold/10 rounded-sm overflow-hidden bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 sm:p-5 text-left hover:bg-gold/[0.02] transition-colors"
      >
        <h4 className="text-foreground font-medium text-base sm:text-lg px-2">{title}</h4>
        <HugeiconsIcon icon={ArrowDown01Icon} size={20} className={`text-gold transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-5 text-muted-foreground text-sm leading-relaxed">
              {text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const valueProps: { icon: IconSvgElement; title: string; text: string }[] = [
  {
    icon: Shield01Icon,
    title: 'The Agoncillo Constraint',
    text: 'Our AI adheres to strict historiographical protocols, prioritizing validated sources over speculative inference.',
  },
  {
    icon: BalanceScaleIcon,
    title: 'Nodes of Contention',
    text: 'Identify conflicting historical narratives instantly. Istifsar highlights discrepancies to facilitate critical debate.',
  },
  {
    icon: ChartBarIncreasingIcon,
    title: 'The Citation Economy',
    text: 'Every claim is backed by a verifiable digital thread, connecting synthesized insights directly to scholarly literature.',
  },
];

export default function LandingPage() {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const { role, loading } = useAuth();
  const router = useRouter();

  // Silent session validation redirect
  useEffect(() => {
    if (!loading && role) {
      if (role === 'admin') {
        router.replace('/admin');
      } else if (role === 'verified_historian') {
        router.replace('/dashboard');
      } else {
        router.replace('/explore');
      }
    }
  }, [role, loading, router]);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const handleScrollToSection = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string, closeMenu = false) => {
    e.preventDefault();
    if (closeMenu) {
      setMobileMenuOpen(false);
      document.body.style.overflow = ''; // Unlock body scroll lock immediately
    }

    // Defer scroll to allow mobile menu to start closing and layout to update
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, closeMenu ? 150 : 0);
  }, []);

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
    <div>
      <FireFlyBackground />
      <ArchiveBookshelfSilhouette />
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.0, ease: 'easeOut' }}
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
            <a
              href="#collections"
              className={navLinkClass('collections')}
              onClick={(e) => handleScrollToSection(e, 'collections')}
            >
              Digital Collections
            </a>
            <a
              href="#agoncillo"
              className={navLinkClass('agoncillo')}
              onClick={(e) => handleScrollToSection(e, 'agoncillo')}
            >
              The Agoncillo Constraint
            </a>
            <a
              href="#boundaries"
              className={navLinkClass('boundaries')}
              onClick={(e) => handleScrollToSection(e, 'boundaries')}
            >
              Platform Boundaries
            </a>
            <a
              href="#historians"
              className={navLinkClass('historians')}
              onClick={(e) => handleScrollToSection(e, 'historians')}
            >
              For Historians
            </a>
          </div>

          {/* Desktop auth buttons */}
          <div className="hidden md:flex items-center space-x-6">
            {!loading && role ? (
              <>
                <Link
                  href={role === 'admin' ? '/admin' : role === 'verified_historian' ? '/dashboard' : '/explore'}
                  className="bg-gold text-background px-6 py-2 rounded-sm text-sm uppercase tracking-widest hover:scale-[1.02] transition-all duration-300 font-medium"
                >
                  Go to Workspace
                </Link>
                <div className="text-gold text-sm uppercase tracking-widest hover:text-gold-bright transition-colors">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
                  href="#collections"
                  onClick={(e) => handleScrollToSection(e, 'collections', true)}
                  className="font-serif font-light tracking-tight text-text-muted-vault hover:text-gold transition-colors text-lg"
                >
                  Digital Collections
                </a>
                <a
                  href="#agoncillo"
                  onClick={(e) => handleScrollToSection(e, 'agoncillo', true)}
                  className="font-serif font-light tracking-tight text-text-muted-vault hover:text-gold transition-colors text-lg"
                >
                  The Agoncillo Constraint
                </a>
                <a
                  href="#boundaries"
                  onClick={(e) => handleScrollToSection(e, 'boundaries', true)}
                  className="font-serif font-light tracking-tight text-text-muted-vault hover:text-gold transition-colors text-lg"
                >
                  Platform Boundaries
                </a>
                <a
                  href="#historians"
                  onClick={(e) => handleScrollToSection(e, 'historians', true)}
                  className="font-serif font-light tracking-tight text-text-muted-vault hover:text-gold transition-colors text-lg"
                >
                  For Historians
                </a>

                <div className="h-px bg-gold/10" />

                {!loading && role ? (
                  <div className="flex flex-col gap-3">
                    <Link
                      href={role === 'admin' ? '/admin' : role === 'verified_historian' ? '/dashboard' : '/explore'}
                      onClick={closeMobileMenu}
                      className="bg-gold text-background px-6 py-3 rounded-sm text-sm uppercase tracking-widest font-medium text-center hover:bg-gold-bright transition-colors"
                    >
                      Go to Workspace
                    </Link>
                    <div className="text-gold text-sm uppercase tracking-widest hover:text-gold-bright transition-colors py-2 text-center">
                      <SignOutButton />
                    </div>
                  </div>
                ) : (
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
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main>
        <section className="relative min-h-screen flex items-start sm:items-center justify-center pt-36 sm:pt-0 px-4 sm:px-6 md:px-0 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="/Background_Landing.jpg"
              alt=""
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-background/45 sm:bg-background/35" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/45 to-background" />
          </div>

          <div className="relative z-10 max-w-5xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1, ease: 'easeOut' }}
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-8xl text-gold leading-tight mb-6 sm:mb-8 tracking-tight"
            >
              Seek the Truth <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
                className="italic font-light font-serif"
              >
                <TypeAnimation
                  sequence={[
                    'of the Past.',
                    2500,
                    'of the Archives.',
                    2500,
                    'of the Documents.',
                    2500,
                  ]}
                  wrapper="span"
                  speed={30}
                  repeat={Infinity}
                  className="inline-block"
                />
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.0, delay: 1.0, ease: 'easeOut' }}
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
              className="flex flex-wrap justify-center gap-6 sm:gap-8 md:gap-16 items-center opacity-50"
            >
              {['Curated Archives', 'Verified Sources', 'Scholarly Nodes'].map(
                (label) => (
                  <motion.span
                    key={label}
                    variants={fadeUp}
                    transition={{ duration: 1.0 }}
                    className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em]"
                  >
                    {label}
                  </motion.span>
                ),
              )}
            </motion.div>
          </div>

          {/* Scroll affordance */}
          <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-10">
            <a
              href="#collections"
              onClick={(e) => handleScrollToSection(e, 'collections')}
              className="flex flex-col items-center justify-center p-4 -m-4 min-w-[48px] min-h-[48px] text-gold/60 hover:text-gold transition-colors duration-300 group"
              aria-label="Scroll down to collections"
            >
              <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] mb-2 font-serif font-light">Scroll</span>
              <ArrowDown className="h-5 w-5" />
            </a>
          </div>
        </section>

        <ArchiveCatalog />

        <section id="agoncillo" className="bg-surface-vault py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16"
          >
            {valueProps.map((prop) => (
              <motion.div
                key={prop.title}
                variants={fadeUp}
                transition={{ duration: 1.0, ease: 'easeOut' }}
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

        <section id="boundaries" className="bg-background py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-12 border-y border-gold/10">
          <div className="max-w-[1440px] mx-auto">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              transition={{ duration: 1.0, ease: 'easeOut' }}
              className="text-center mb-10 sm:mb-14"
            >
              <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground mb-6">
                Capabilities & Limits
              </h2>
              <p className="max-w-2xl mx-auto text-muted-foreground text-sm sm:text-base leading-relaxed">
                In the realm of historical research, understanding the limitations of a tool is just as important as knowing its strengths. Istifsar AI is designed to assist, not replace, the rigorous work of historical analysis.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                className="space-y-8"
              >
                <div className="border-b border-gold/20 pb-4 mb-8">
                  <h3 className="font-serif italic text-gold text-2xl tracking-wide">What Istifsar AI Is</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted-vault mt-2">Our Capabilities</p>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'An Engine for Academic Consensus', text: 'Navigates a strictly vetted database of scholarly writings to present the prevailing historical consensus.' },
                    { title: 'A Citation-Driven Assistant', text: 'Every synthesis generated is anchored to retrieved texts with clear, traceable citations so you can verify the original academic context.' },
                    { title: 'A Contextual Navigator', text: 'Surfaces relevant historiographical debates, key figures, and temporal contexts that would normally require hours of manual review.' },
                    { title: 'A Human-Governed Platform', text: 'Ruled by human Historians who review outputs, flag anomalies, and ensure strict adherence to academic standards.' }
                  ].map((item, i) => (
                    <AccordionItem key={i} title={item.title} text={item.text} defaultOpen={i === 0} />
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                className="space-y-8"
              >
                <div className="border-b border-gold/20 pb-4 mb-8">
                  <h3 className="font-serif italic text-gold text-2xl tracking-wide">What Istifsar AI Isn't</h3>
                  <p className="text-xs uppercase tracking-[0.2em] text-text-muted-vault mt-2">Our Limitations</p>
                </div>
                <div className="space-y-4">
                  {[
                    { title: 'Not a Generator of New Primary Research', text: 'Does not conduct original research. It cannot interpret raw archival documents or formulate entirely new historical theories.' },
                    { title: 'Not an Arbiter of Absolute Truth', text: 'The AI does not provide an unquestionable final word; it reflects the current scholarly landscape and acknowledges debates.' },
                    { title: 'Not an Autonomous Oracle', text: 'A retrieval tool, not an independent thinker. Hallucinations or anachronisms are subject to immediate correction by our Historian tier.' },
                    { title: 'Not a Creative Storyteller', text: 'Explicitly tuned to prevent creative extrapolation. If there is insufficient scholarly data, it will state that information is unavailable rather than invent a narrative.' }
                  ].map((item, i) => (
                    <AccordionItem key={i} title={item.title} text={item.text} defaultOpen={i === 0} />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section
          id="historians"
          className="py-14 sm:py-20 md:py-28 text-center max-w-4xl mx-auto px-4 sm:px-6 md:px-8"
        >
          <motion.h2
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 1.0, ease: 'easeOut' }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground mb-8 sm:mb-12"
          >
            History is not just preserved; it is understood.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 1.0, delay: 0.5, ease: 'easeOut' }}
            className="text-muted-foreground mb-10 sm:mb-16 text-sm sm:text-base md:text-lg leading-relaxed"
          >
            Access to the Istifsar engine is by Admin Verification. We invite historians to help us curate the future of our
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
              Sign Up for Historian Access
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
        className="w-full border-t border-border relative z-20 bg-background"
      >
        <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-16 py-6 md:py-8 w-full max-w-[1440px] mx-auto gap-6 md:gap-8">
          <p className="text-xs sm:text-sm tracking-widest uppercase text-text-muted-vault text-center md:text-left">
            &copy; 2026 Istifsar AI. All rights reserved. The Digital Curator.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-12">
            <a
              href="#"
              className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase text-text-muted-vault hover:text-gold transition-all opacity-80 hover:opacity-100"
            >
              Privacy Policy
            </a>
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase text-text-muted-vault hover:text-gold transition-all opacity-80 hover:opacity-100"
            >
              Contact
            </button>
            <a
              href="https://github.com/Oninlovesjiujitsu/istifsar-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted-vault hover:text-gold transition-all opacity-80 hover:opacity-100"
              aria-label="GitHub Repository"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </motion.footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <FloatingBackToTop />
    </div>
  );
}

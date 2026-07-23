'use client';

import { motion } from 'motion/react';
import { TypeAnimation } from 'react-type-animation';
import { ArrowDown } from 'lucide-react';
import HeroDemoPreview from './HeroDemoPreview';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 sm:pt-28 md:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 md:px-12 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Soft, warm spotlight gradient simulating a reading lamp on a desk */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(43_60%_98%)_0%,_hsl(var(--background))_100%)] opacity-80" />
      </div>

      <div className="relative z-10 max-w-5xl text-center w-full">
        {/* Custom Graph RAG Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3.5 sm:px-4 py-1.5 rounded-full mb-6 shadow-sm"
        >
          <span className="shrink-0">🕸️</span>
          <span>Powered by Custom Graph RAG &amp; Grounded Archival Retrieval</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: 'easeOut' }}
          className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-primary leading-[1.15] mb-4 sm:mb-8 tracking-tight break-words"
        >
          Unearth Truth Anchored <br className="hidden sm:inline" />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="italic font-light font-serif text-foreground inline-block mt-1 sm:mt-0"
          >
            <TypeAnimation
              sequence={[
                'in Historian Writings.',
                2500,
                'in Archival Literature.',
                2500,
                'in Verified Documents.',
                2500,
              ]}
              wrapper="span"
              speed={30}
              repeat={Infinity}
              className="inline-block max-w-full"
            />
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: 'easeOut' }}
          className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8 sm:mb-12 px-2 font-sans"
        >
          Driven by a custom-built Graph RAG engine over trustworthy historian publications. Traversing entity networks, mapping documented node contentions, and eliminating AI speculation.
        </motion.p>

        {/* Dual CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-5 mb-10 sm:mb-14 w-full max-w-md sm:max-w-none mx-auto px-2"
        >
          <a
            href="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-primary text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-md text-xs sm:text-sm font-semibold uppercase tracking-widest hover:bg-foreground hover:text-background shadow-md transition-all duration-200 group text-center"
          >
            Explore Archives &amp; Debates
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </a>

          <a
            href="/signup"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent border border-primary text-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-md text-xs sm:text-sm font-semibold uppercase tracking-widest hover:bg-primary/10 transition-all duration-200 text-center"
          >
            Join as Historian
          </a>
        </motion.div>

        {/* Interactive Live Query Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.0, ease: 'easeOut' }}
        >
          <HeroDemoPreview />
        </motion.div>
      </div>

      {/* Scroll affordance */}
      <div className="mt-16 flex flex-col items-center animate-bounce z-10">
        <a
          href="#pillars"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('pillars')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex flex-col items-center justify-center p-4 min-w-[48px] min-h-[48px] text-muted-foreground hover:text-primary transition-colors duration-300 group cursor-pointer"
          aria-label="Scroll down to platform features"
        >
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] mb-2 font-serif font-light">
            Scroll to Features
          </span>
          <ArrowDown className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BookOpen02Icon } from '@hugeicons/core-free-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const viewport = { once: true, amount: 0.3 as const };

export default function HistoriansSection() {
  return (
    <section
      id="historians"
      className="pt-16 sm:pt-24 pb-20 sm:pb-32 text-center max-w-4xl mx-auto px-4 sm:px-6 md:px-8 scroll-mt-20"
    >
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 1.0, ease: 'easeOut' }}
        className="font-heading text-2xl sm:text-4xl md:text-5xl text-foreground mb-6 sm:mb-12"
      >
        History is not just preserved; it is understood.
      </motion.h2>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 1.0, delay: 0.3, ease: 'easeOut' }}
        className="text-muted-foreground mb-8 sm:mb-16 text-xs sm:text-base md:text-lg leading-relaxed px-2"
      >
        Access to the Istifsar engine is by Admin Verification. We invite historians to help us curate the future of our shared past.
      </motion.p>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        className="w-full flex justify-center"
      >
        <Link
          href="/signup"
          className="w-full sm:w-auto inline-flex items-center justify-center bg-transparent border border-primary text-primary px-6 sm:px-8 md:px-12 py-3.5 sm:py-4 md:py-5 rounded-sm uppercase tracking-widest text-xs sm:text-sm font-semibold outline outline-1 outline-offset-2 outline-primary/30 hover:outline-primary/60 hover:bg-primary/5 transition-all group text-center"
        >
          Sign Up for Historian Access
          <HugeiconsIcon
            icon={BookOpen02Icon}
            size={18}
            className="ml-3 sm:ml-4 group-hover:translate-x-2 transition-transform duration-300 shrink-0"
          />
        </Link>
      </motion.div>
    </section>
  );
}

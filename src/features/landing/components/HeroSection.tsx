'use client';

import { motion } from 'motion/react';
import { TypeAnimation } from 'react-type-animation';
import { ArrowDown } from 'lucide-react';

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
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('collections')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex flex-col items-center justify-center p-4 -m-4 min-w-[48px] min-h-[48px] text-gold/60 hover:text-gold transition-colors duration-300 group"
          aria-label="Scroll down to collections"
        >
          <span className="hidden sm:inline text-[10px] uppercase tracking-[0.2em] mb-2 font-serif font-light">Scroll</span>
          <ArrowDown className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}

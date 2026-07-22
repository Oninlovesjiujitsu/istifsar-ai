'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  UserGroupIcon,
  QuillWrite01Icon,
  Search01Icon,
  BookBookmark02Icon,
  BalanceScaleIcon,
  HelpCircleIcon,
  Upload01Icon,
  Shield01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

export default function PersonaSection() {
  return (
    <section id="personas" className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-surface-vault border-y border-border/50 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 sm:mb-4">
            Dual Ecosystem
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl text-foreground mb-3 sm:mb-4">
            Designed for Scholars and Curious Minds
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-xs sm:text-base leading-relaxed px-2">
            Whether you are seeking truth behind historical myths or curating rare archival documents, Istifsar AI connects you to verified historian literature.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Persona Card 1: History Readers */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
            className="bg-card rounded-xl border border-border/60 p-5 sm:p-8 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 sm:w-32 h-28 sm:h-32 bg-primary/5 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="p-2.5 sm:p-3 rounded-lg bg-primary/10 text-primary shrink-0">
                  <HugeiconsIcon icon={UserGroupIcon} size={22} />
                </div>
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                    History Readers &amp; Enthusiasts
                  </h3>
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Explore &amp; Discover
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                Uncover facts grounded in historian publications. Say goodbye to hallucinated internet rumors and explore verified historiographical debates.
              </p>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {[
                  {
                    icon: Search01Icon,
                    title: 'Query Agoncillo AI Engine',
                    desc: 'Get synthesized answers anchored strictly in verified historian literature.',
                  },
                  {
                    icon: BalanceScaleIcon,
                    title: 'Interactive Contention Graphs',
                    desc: 'Compare competing historical perspectives side-by-side with evidence weights.',
                  },
                  {
                    icon: HelpCircleIcon,
                    title: 'Submit Research Requests',
                    desc: 'Flag missing historical topics or offer bounties for unindexed sources.',
                  },
                  {
                    icon: BookBookmark02Icon,
                    title: 'Curate Personal Reading Lists',
                    desc: 'Bookmark historical writings and organize academic research topics.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-md bg-background/50 border border-border/30">
                    <div className="p-1 sm:p-1.5 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
                      <HugeiconsIcon icon={item.icon} size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground font-heading">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/explore"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 sm:py-3.5 px-5 sm:px-6 rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-foreground hover:text-background transition-all shadow-sm group w-full text-center"
            >
              Start Exploring Archives
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Persona Card 2: Verified Historians */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="bg-card rounded-xl border border-border/60 p-5 sm:p-8 flex flex-col justify-between shadow-sm hover:border-primary/40 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-28 sm:w-32 h-28 sm:h-32 bg-amber-500/5 rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-5 sm:mb-6">
                <div className="p-2.5 sm:p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0">
                  <HugeiconsIcon icon={QuillWrite01Icon} size={22} />
                </div>
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
                    Verified Historians &amp; Scholars
                  </h3>
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    Catalog &amp; Contribute
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                Preserve historical truth. Upload primary document transcriptions, expand the digital vault, and solve reader research requests.
              </p>

              <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                {[
                  {
                    icon: Upload01Icon,
                    title: 'Upload Historical Works & Documents',
                    desc: 'Index verified writings into the Agoncillo citation database.',
                  },
                  {
                    icon: HelpCircleIcon,
                    title: 'Fulfill Research Bounties',
                    desc: 'Address crowd-sourced historical gap requests from researchers and readers.',
                  },
                  {
                    icon: Shield01Icon,
                    title: 'Verified Scholar Accreditation',
                    desc: 'Gain verified historian status via admin verification and contribution badges.',
                  },
                  {
                    icon: BalanceScaleIcon,
                    title: 'Annotate Nodes of Contention',
                    desc: 'Manage documented evidence weights and historical controversy nodes.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-md bg-background/50 border border-border/30">
                    <div className="p-1 sm:p-1.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                      <HugeiconsIcon icon={item.icon} size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-foreground font-heading">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground leading-normal">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-transparent border border-primary text-primary py-3 sm:py-3.5 px-5 sm:px-6 rounded-md font-semibold text-xs uppercase tracking-widest hover:bg-primary/10 transition-all group w-full text-center"
            >
              Apply as Verified Historian
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

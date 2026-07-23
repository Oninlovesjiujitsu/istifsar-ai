'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BookOpen02Icon,
  BalanceScaleIcon,
  HelpCircleIcon,
  ArrowRight01Icon,
  Shield01Icon,
} from '@hugeicons/core-free-icons';
import TiltCard from './TiltCard';

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

const pillars = [
  {
    id: 'agoncillo-engine',
    icon: BookOpen02Icon,
    title: 'The Agoncillo Graph RAG Engine',
    tagline: 'Custom Graph-Guided Archival Retrieval',
    description:
      'Custom Graph RAG Engine — Traversing entity networks and historical relationships to retrieve multi-hop context that traditional search misses. Every answer links directly to verified source citations.',
    highlights: [
      'Custom Graph-guided entity traversal',
      'Page-level citation anchoring',
      'Multi-hop relationship reasoning',
    ],
    ctaText: 'Test Agoncillo Engine',
    ctaHref: '/explore',
  },
  {
    id: 'contention-explorer',
    icon: BalanceScaleIcon,
    title: 'Nodes of Contention Explorer',
    tagline: 'Mapping Historical Debates',
    description:
      'History is rarely monolithic. Istifsar maps documented conflicting perspectives side-by-side, displaying evidence weights and key historian positions without forcing false consensus.',
    highlights: [
      'Side-by-side argument analysis',
      'Documented evidence weighting',
      'Historical context timeline',
    ],
    ctaText: 'Explore Contention Graph',
    ctaHref: '/explore',
  },
  {
    id: 'research-bounties',
    icon: HelpCircleIcon,
    title: 'Research Bounties & Gaps',
    tagline: 'Crowdsourced Scholarly Inquiry',
    description:
      'When readers encounter undocumented historical gaps or missing primary sources, they can post research requests and fund bounties for verified historians to investigate and catalog.',
    highlights: [
      'Community research request board',
      'Historical gap categorization',
      'Historian bounty fulfillment',
    ],
    ctaText: 'Browse Research Requests',
    ctaHref: '/explore',
  },
];

export default function PlatformPillarsSection() {
  return (
    <section id="pillars" className="py-16 sm:py-24 px-4 sm:px-6 md:px-12 bg-background scroll-mt-20">
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
            Platform Features
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl text-foreground mb-3 sm:mb-4">
            How Istifsar AI Transforms Historical Research
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-xs sm:text-base leading-relaxed px-2">
            Engineered to eliminate hallucination, map historiographical debates, and bridge history enthusiasts with verified scholar literature.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 perspective-1000">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={pillar.id}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
            >
              <TiltCard className="flex flex-col h-full bg-card rounded-xl border border-border/60 p-5 sm:p-8 shadow-sm hover:border-primary/50 hover:shadow-xl transition-all h-full">
                <div className="p-3 rounded-md bg-primary/10 text-primary w-fit mb-5 sm:mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <HugeiconsIcon icon={pillar.icon} size={24} />
                </div>

                <div className="text-[11px] uppercase font-mono tracking-wider text-primary mb-1 font-semibold">
                  {pillar.tagline}
                </div>

                <h3 className="font-heading text-lg sm:text-xl text-foreground mb-2.5 sm:mb-3 font-semibold">
                  {pillar.title}
                </h3>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                  {pillar.description}
                </p>

                <div className="space-y-2 mb-6 sm:mb-8 pt-4 border-t border-border/40">
                  {pillar.highlights.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground/80 font-medium">
                      <HugeiconsIcon icon={Shield01Icon} size={14} className="text-primary shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={pillar.ctaHref}
                  className="inline-flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-primary group-hover:text-foreground transition-colors pt-3 border-t border-border/30 min-h-[40px]"
                >
                  <span>{pillar.ctaText}</span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

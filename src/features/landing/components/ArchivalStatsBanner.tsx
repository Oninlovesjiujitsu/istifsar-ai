'use client';

import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  BalanceScaleIcon,
  BookBookmark02Icon,
  HelpCircleIcon,
} from '@hugeicons/core-free-icons';

const stats = [
  {
    icon: Shield01Icon,
    value: '100%',
    label: 'Historian Literature Grounding',
    detail: 'Zero unverified AI extrapolation',
  },
  {
    icon: BalanceScaleIcon,
    value: 'Dual-Node',
    label: 'Contention Mapping',
    detail: 'Visualizing documented debate splits',
  },
  {
    icon: BookBookmark02Icon,
    value: 'Curated Vault',
    label: 'Primary & Secondary Texts',
    detail: 'Indexed writings of trusted scholars',
  },
  {
    icon: HelpCircleIcon,
    value: 'Research Bounties',
    label: 'Gap Identification',
    detail: 'Readers & historians crowd-funding sources',
  },
];

export default function ArchivalStatsBanner() {
  return (
    <section className="bg-surface-vault/70 border-y border-border/50 py-8 sm:py-10 px-4 sm:px-6 md:px-12 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: idx * 0.1 }}
            className="flex flex-col items-center text-center p-4 sm:p-5 rounded-md border border-border/30 bg-card/30 hover:border-primary/30 transition-colors"
          >
            <div className="p-2.5 rounded-full bg-primary/10 text-primary mb-2.5 sm:mb-3 shrink-0">
              <HugeiconsIcon icon={stat.icon} size={20} />
            </div>
            <div className="font-heading text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1">
              {stat.value}
            </div>
            <div className="font-serif font-medium text-xs sm:text-sm text-primary mb-1">
              {stat.label}
            </div>
            <div className="text-[11px] text-muted-foreground leading-normal">
              {stat.detail}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

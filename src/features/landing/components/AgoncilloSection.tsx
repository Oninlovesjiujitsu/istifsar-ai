'use client';

import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  BalanceScaleIcon,
  ChartBarIncreasingIcon,
} from '@hugeicons/core-free-icons';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const viewport = { once: true, amount: 0.3 as const };

const valueProps = [
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

export default function AgoncilloSection() {
  return (
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
  );
}

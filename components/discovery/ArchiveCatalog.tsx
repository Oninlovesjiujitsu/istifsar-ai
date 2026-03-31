'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  QuillWrite01Icon,
  BookOpen01Icon,
  SailboatCoastalIcon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';

type Collection = {
  slug: string;
  title: string;
  stat: string;
  description: string;
  icon: IconSvgElement;
};

// Static catalog data — will be replaced with dynamic Supabase query
// (source_documents JOIN document_tags, grouped by era/topic)
const collections: Collection[] = [
  {
    slug: 'philippine-revolution',
    title: 'The Philippine Revolution',
    stat: '45 Peer-Reviewed Essays',
    description: 'Katipunan primary sources and insurgent records.',
    icon: QuillWrite01Icon,
  },
  {
    slug: 'martial-law-era',
    title: 'The Martial Law Era',
    stat: '12 Scholarly Perspectives',
    description: 'Scholars insights during the Martial Law Era.',
    icon: BookOpen01Icon,
  },
  {
    slug: 'pre-colonial-trade',
    title: 'Pre-Colonial Trade',
    stat: '8 Documents',
    description:
      'Mapping the maritime silk road through ceramic remnants and early Austronesian navigation charts.',
    icon: SailboatCoastalIcon,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const viewport = { once: true, amount: 0.2 as const };

export default function ArchiveCatalog() {
  return (
    <section className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="flex flex-col mb-16 md:mb-20"
      >
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="font-heading text-2xl sm:text-3xl md:text-4xl text-foreground mb-4"
        >
          The Digital Collections
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={viewport}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          className="w-24 h-px bg-gold/40 origin-left"
        />
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
      >
        {collections.map((collection) => (
          <motion.div
            key={collection.slug}
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <Link
              href={`/explore?era=${collection.slug}`}
              className="group relative block bg-card p-8 md:p-10 rounded-sm border border-gold/20 hover:border-gold/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] overflow-hidden"
            >
              <div className="absolute -right-6 -top-6 text-gold/5 group-hover:text-gold/10 transition-colors duration-500">
                <HugeiconsIcon icon={collection.icon} size={96} strokeWidth={0.5} />
              </div>

              <h3 className="font-heading text-xl md:text-2xl text-gold mb-2">
                {collection.title}
              </h3>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
                {collection.stat}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                {collection.description}
              </p>

              <div className="flex items-center text-gold text-xs uppercase tracking-widest font-semibold group-hover:gap-3 gap-0 transition-all duration-300">
                Explore Collection
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-2" />
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

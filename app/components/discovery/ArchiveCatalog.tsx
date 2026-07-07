'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  BookOpen01Icon,
} from '@hugeicons/core-free-icons';
import { getArchiveCatalog } from '@/actions/catalog';
import type { CatalogTag } from '@/lib/cache/redis';

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
  const [collections, setCollections] = useState<CatalogTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getArchiveCatalog()
      .then((data) => {
        const topThree = [...data]
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        setCollections(topThree);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="collections" className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="flex flex-col mb-16 md:mb-20"
      >
        <motion.h2
          variants={fadeUp}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          className="font-heading text-2xl sm:text-3xl md:text-4xl text-foreground mb-4"
        >
          The Digital Collections
        </motion.h2>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={viewport}
          transition={{ duration: 1.0, delay: 0.5, ease: 'easeOut' }}
          className="w-24 h-px bg-gold/40 origin-left"
        />
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card p-8 md:p-10 rounded-sm border border-gold/20 animate-pulse h-56"
            />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No collections available yet. Writings are being added to the archive.
        </p>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
        >
          {collections.map((collection) => (
            <motion.div
              key={collection.id}
              variants={fadeUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Link
                href={`/explore?era=${collection.slug}`}
                className="group relative block bg-card p-8 md:p-10 rounded-sm border border-gold/20 hover:border-gold/60 transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.15)] hover:-translate-y-2 hover:scale-[1.01] overflow-hidden"
              >
                <div className="absolute -right-6 -top-6 text-gold/5 group-hover:text-gold/10 transition-colors duration-500">
                  <HugeiconsIcon icon={BookOpen01Icon} size={96} strokeWidth={0.5} />
                </div>

                <h3 className="font-heading text-xl md:text-2xl text-gold mb-2">
                  {collection.name}
                </h3>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
                  {collection.count} {collection.count === 1 ? 'Writing' : 'Writings'}
                </p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-8">
                  {collection.description ?? `Explore writings tagged with ${collection.name}.`}
                </p>

                <div className="flex items-center text-gold text-xs uppercase tracking-widest font-semibold group-hover:gap-3 gap-0 transition-all duration-300">
                  Explore Collection
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-2" />
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

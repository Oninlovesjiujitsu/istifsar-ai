'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { getArchiveCatalog } from '@/src/features/publications/actions/catalog';
import type { CatalogTag } from '@/src/lib/cache/redis';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import ArchiveCard from './ArchiveCard';

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
  const { role } = useAuth();

  const getDestination = (slug: string) => {
    if (role === 'verified_historian') {
      return '/dashboard';
    } else if (role === 'admin') {
      return '/admin';
    } else {
      return `/documents/${slug}`;
    }
  };

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
    <section id="collections" className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32">
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
          className="w-24 h-px bg-primary/40 origin-left"
        />
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card p-8 md:p-10 rounded-sm border border-border animate-pulse h-56"
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
          className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12"
        >
          {collections.map((collection) => (
            <motion.div
              key={collection.id}
              variants={fadeUp}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col h-full"
            >
              <ArchiveCard
                href={getDestination(collection.slug)}
                title={collection.name}
                description={collection.description ?? `Explore writings tagged with ${collection.name}.`}
                stat={`${collection.count} ${collection.count === 1 ? 'writing' : 'writings'}`}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

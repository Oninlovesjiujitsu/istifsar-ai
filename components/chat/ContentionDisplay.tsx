'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import ContentionCards from './ContentionCards';
import ContentionGraph from './ContentionGraph';
import type { ContentionMeta } from '@/types/contention';
import { cn } from '@/lib/utils';

type Props = {
  contentions: ContentionMeta[];
};

export default function ContentionDisplay({ contentions }: Props) {
  const [view, setView] = useState<'text' | 'visual'>('text');

  return (
    <div className="mt-4 border border-gold/20 rounded-sm overflow-hidden">
      {/* Header with toggle */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-white/[0.06] bg-gold/5">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-4 h-4 text-gold shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
            />
          </svg>
          <span className="text-[10px] uppercase tracking-widest text-gold/70 font-bold">
            Structural Visualization
          </span>
        </div>
        <div className="flex bg-[#0e0e0e] p-1 rounded-sm border border-white/[0.06]">
          <button
            type="button"
            className={cn(
              'px-3 py-1 text-[10px] uppercase tracking-wider transition-colors rounded-sm',
              view === 'text'
                ? 'bg-gold/15 text-gold font-bold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
            onClick={() => setView('text')}
          >
            Text View
          </button>
          <button
            type="button"
            className={cn(
              'px-3 py-1 text-[10px] uppercase tracking-wider transition-colors rounded-sm',
              view === 'visual'
                ? 'bg-gold/15 text-gold font-bold shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                : 'text-zinc-500 hover:text-zinc-300',
            )}
            onClick={() => setView('visual')}
          >
            Visual View
          </button>
        </div>
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        {view === 'text' ? (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ContentionCards contentions={contentions} />
          </motion.div>
        ) : (
          <motion.div
            key="visual"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ContentionGraph contentions={contentions} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

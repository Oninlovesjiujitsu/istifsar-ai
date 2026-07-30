'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  BalanceScaleIcon,
  ChartBarIncreasingIcon,
} from '@hugeicons/core-free-icons';

// Dynamic import for the 3D Canvas to prevent SSR (hydration mismatch) errors
const AgoncilloCanvasClient = dynamic(
  () => import('./AgoncilloCanvas'),
  { ssr: false }
);

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const viewport = { once: true, amount: 0.2 as const };

const valueProps = [
  {
    id: 'constraint' as const,
    icon: Shield01Icon,
    title: 'The Agoncillo Principle',
    text: 'Our AI engine adheres to strict historiographical boundaries—built exclusively on the indexed writings and verified publications of trustworthy historians.',
  },
  {
    id: 'contention' as const,
    icon: BalanceScaleIcon,
    title: 'Nodes of Contention',
    text: 'Identify conflicting historical perspectives as documented across scholar literature. Istifsar highlights discrepancies to facilitate critical debate.',
  },
  {
    id: 'citation' as const,
    icon: ChartBarIncreasingIcon,
    title: 'The Citation Economy',
    text: 'Every synthesized response is anchored to verified historian texts, connecting insights directly to page-level citations.',
  },
];

export default function AgoncilloSection() {
  const [activeTab, setActiveTab] = useState<'none' | 'constraint' | 'contention' | 'citation'>('none');

  return (
    <section id="agoncillo" className="bg-surface-vault pt-16 sm:pt-24 pb-20 sm:pb-32 px-4 sm:px-6 md:px-12 scroll-mt-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center"
      >
        {/* Left Column: Text Content and Interactive Value Cards */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-6 sm:space-y-10">
          <div>
            <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl text-foreground mb-3 sm:mb-4">
              Rigorous Epistemic Standards
            </h2>
            <p className="text-xs sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              History is not built on speculative AI generation, but on verified archival records. We enforce these structural principles to ground every insight in source literature.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            {valueProps.map((prop) => {
              const isActive = activeTab === prop.id;
              return (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => setActiveTab((prev) => (prev === prop.id ? 'none' : prop.id))}
                  onMouseEnter={() => {
                    if (window.matchMedia('(hover: hover)').matches) {
                      setActiveTab(prop.id);
                    }
                  }}
                  onMouseLeave={() => {
                    if (window.matchMedia('(hover: hover)').matches) {
                      setActiveTab('none');
                    }
                  }}
                  className={`w-full text-left flex flex-row items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-md border transition-all duration-300 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40 ${isActive
                      ? 'bg-card border-primary shadow-sm translate-x-1 sm:translate-x-3'
                      : 'bg-card/40 border-border/50 hover:bg-card/70 hover:border-border'
                    }`}
                >
                  <div className={`p-2.5 sm:p-3 rounded-sm border transition-colors duration-300 shrink-0 ${isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-primary border-border'
                    }`}>
                    <HugeiconsIcon icon={prop.icon} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="font-heading text-sm sm:text-lg text-foreground font-semibold">
                        {prop.title}
                      </h4>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors shrink-0 ${isActive
                          ? 'bg-primary/20 text-primary font-bold'
                          : 'bg-muted text-muted-foreground opacity-70'
                        }`}>
                        {isActive ? 'Active Node' : 'Tap to View'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {prop.text}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: 3D Visualization Canvas Container */}
        <div className="lg:col-span-6 xl:col-span-5 w-full flex items-center justify-center lg:sticky lg:top-24">
          <div className="w-full max-w-[500px] h-[280px] sm:h-[400px] lg:h-[500px] bg-card/20 rounded-md border border-border/40 relative overflow-hidden parchment-texture">
            {/* Subtle light vignette for WebGL context */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 bg-radial-[circle_at_center,transparent_40%,hsl(var(--background))_100%]" />

            {/* Dynamic WebGL canvas */}
            <AgoncilloCanvasClient activeTab={activeTab} />
          </div>
        </div>
      </motion.div>
    </section>
  );
}


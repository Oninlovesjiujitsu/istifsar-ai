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
    title: 'The Agoncillo Constraint',
    text: 'Our AI adheres to strict historiographical protocols, prioritizing validated sources over speculative inference.',
  },
  {
    id: 'contention' as const,
    icon: BalanceScaleIcon,
    title: 'Nodes of Contention',
    text: 'Identify conflicting historical narratives instantly. Istifsar highlights discrepancies to facilitate critical debate.',
  },
  {
    id: 'citation' as const,
    icon: ChartBarIncreasingIcon,
    title: 'The Citation Economy',
    text: 'Every claim is backed by a verifiable digital thread, connecting synthesized insights directly to scholarly literature.',
  },
];

export default function AgoncilloSection() {
  const [activeTab, setActiveTab] = useState<'none' | 'constraint' | 'contention' | 'citation'>('none');

  return (
    <section id="agoncillo" className="bg-surface-vault pt-24 pb-32 px-4 sm:px-6 md:px-12 scroll-mt-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center"
      >
        {/* Left Column: Text Content and Interactive Value Cards */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-8 sm:space-y-10">
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl text-foreground mb-4">
              Rigorous Epistemic Standards
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
              History is not built on speculative AI generation, but on verified archival records. We enforce these structural principles to ground every insight in source literature.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {valueProps.map((prop) => {
              const isActive = activeTab === prop.id;
              return (
                <div
                  key={prop.id}
                  onMouseEnter={() => setActiveTab(prop.id)}
                  onMouseLeave={() => setActiveTab('none')}
                  onClick={() => setActiveTab(prop.id)}
                  className={`flex flex-row items-start gap-4 p-5 rounded-md border transition-all duration-300 select-none cursor-pointer ${isActive
                      ? 'bg-card border-primary/40 shadow-sm translate-x-1 sm:translate-x-3'
                      : 'bg-transparent border-transparent hover:bg-card/30 hover:border-border/30'
                    }`}
                >
                  <div className={`p-3 rounded-sm border transition-colors duration-300 ${isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-primary border-border'
                    }`}>
                    <HugeiconsIcon icon={prop.icon} size={22} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-heading text-base sm:text-lg text-foreground mb-1.5 sm:mb-2">
                      {prop.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {prop.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 3D Visualization Canvas Container */}
        <div className="lg:col-span-6 xl:col-span-5 w-full flex items-center justify-center lg:sticky lg:top-24">
          <div className="w-full max-w-[500px] aspect-square lg:aspect-auto lg:h-[500px] bg-card/20 rounded-md border border-border/40 relative overflow-hidden parchment-texture">
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


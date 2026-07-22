'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BookOpen02Icon,
  BalanceScaleIcon,
  Search01Icon,
  Shield01Icon,
  ArrowRight01Icon,
  DatabaseIcon,
  HelpCircleIcon,
} from '@hugeicons/core-free-icons';

type PreviewTab = 'consensus' | 'contention' | 'citations';

export default function HeroDemoPreview() {
  const [activeTab, setActiveTab] = useState<PreviewTab>('consensus');
  const [isQuerying, setIsQuerying] = useState(false);

  const handleSimulateQuery = () => {
    setIsQuerying(true);
    setTimeout(() => {
      setIsQuerying(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 text-left shadow-2xl rounded-lg border border-border/60 bg-card/90 backdrop-blur-md overflow-hidden font-sans parchment-texture">
      {/* Search Header Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between px-4 sm:px-6 py-3.5 bg-muted/40 border-b border-border/50 gap-3">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 animate-pulse" />
          <span className="tracking-wider uppercase font-semibold text-foreground/80">
            Istifsar Agoncillo Engine
          </span>
          <span className="hidden md:inline text-border">|</span>
          <span className="hidden md:inline text-muted-foreground/80">
            Querying 1,420+ Historian Works
          </span>
        </div>

        <div className="flex items-center gap-2 bg-background/80 border border-border/60 rounded-md px-3 py-1.5 flex-1 max-w-md shadow-inner">
          <HugeiconsIcon icon={Search01Icon} size={15} className="text-primary/70 shrink-0" />
          <span className="text-xs text-foreground/90 font-serif italic truncate">
            &ldquo;Did Jose Rizal sign a retraction document before execution?&rdquo;
          </span>
          <button
            onClick={handleSimulateQuery}
            disabled={isQuerying}
            className="ml-auto text-[10px] uppercase tracking-wider font-semibold bg-primary/10 hover:bg-primary/20 text-primary px-2 py-0.5 rounded transition-colors cursor-pointer"
          >
            {isQuerying ? 'Analyzing...' : 'Re-run'}
          </button>
        </div>
      </div>

      {/* Interactive Feature Tabs */}
      <div className="flex border-b border-border/50 bg-background/40 px-2 sm:px-6 overflow-x-auto no-scrollbar">
        {[
          {
            id: 'consensus' as const,
            label: 'Historian Synthesis',
            icon: BookOpen02Icon,
            badge: 'Agoncillo Grounded',
          },
          {
            id: 'contention' as const,
            label: 'Nodes of Contention',
            icon: BalanceScaleIcon,
            badge: '2 Major Positions',
          },
          {
            id: 'citations' as const,
            label: 'Source Citations',
            icon: DatabaseIcon,
            badge: '4 Scholarly Documents',
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-3 px-3 sm:px-5 border-b-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${isActive
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-card/40'
                }`}
            >
              <HugeiconsIcon icon={tab.icon} size={16} />
              <span>{tab.label}</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-mono font-semibold ${isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                  }`}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-7 min-h-[220px] bg-background/30 relative">
        <AnimatePresence mode="wait">
          {isQuerying ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-12 space-y-3"
            >
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground font-mono">
                Scanning historian literature &amp; primary manuscripts...
              </p>
            </motion.div>
          ) : activeTab === 'consensus' ? (
            <motion.div
              key="consensus"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <HugeiconsIcon icon={Shield01Icon} size={16} />
                  <span>Synthesized from 4 Historian Publications (Guerrero, Schumacher, Coates, Zaide)</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Zero Speculation
                </span>
              </div>

              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-serif">
                Historians remain divided into two major scholarly traditions regarding Jose Rizal’s alleged retraction document discovered in 1935 by Fr. Manuel Garcia. Scholars such as
                <span className="inline-flex items-center gap-1 font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 mx-1">
                  Fr. John N. Schumacher, S.J. [Ref: 1999]
                </span>
                and
                <span className="inline-flex items-center gap-1 font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 mx-1">
                  Leon Ma. Guerrero [Ref: 1963]
                </span>
                conclude that the physical manuscript is authentic based on forensic handwriting analysis, while arguing it reflected a return to personal faith rather than political surrender. Conversely, historians like
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 mx-1">
                  Dr. Nicolas Zafra
                </span>
                and critical analysts highlight textual discrepancies between the 1896 newspaper transcripts and the 1935 rediscovered manuscript.
              </p>

              <div className="p-3 rounded-md bg-card/80 border border-border/50 text-xs flex items-start gap-2.5">
                <HugeiconsIcon icon={HelpCircleIcon} size={16} className="text-primary mt-0.5 shrink-0" />
                <div className="text-muted-foreground leading-normal">
                  <strong className="text-foreground">Agoncillo Engine Guarantee:</strong> This output contains no generated speculation. All statements are mapped directly to verified published works by Philippine historians.
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'contention' ? (
            <motion.div
              key="contention"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="text-xs text-muted-foreground mb-1">
                Competing Perspectives documented across historian literature:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Node A */}
                <div className="p-4 rounded-md bg-card border border-primary/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-mono px-2 py-0.5 font-bold uppercase tracking-wider rounded-bl">
                    Authenticity Position
                  </div>
                  <h4 className="font-heading text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Forensic &amp; Ecclesiastical Evidence
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Argues the 1935 text matches Rizal’s handwriting. Supported by eyewitness testimony of Jesuit priests present at Fort Santiago (Fr. Balaguer, Fr. Viza).
                  </p>
                  <div className="mt-3 text-[11px] text-primary/80 font-mono">
                    Key Authors: Schumacher, Guerrero, Cavanna
                  </div>
                </div>

                {/* Node B */}
                <div className="p-4 rounded-md bg-card border border-amber-500/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-mono px-2 py-0.5 font-bold uppercase tracking-wider rounded-bl">
                    Contested / Skeptical Position
                  </div>
                  <h4 className="font-heading text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Textual Anomalies &amp; Context
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Highlights variations in spelling (&ldquo;mi calidad&rdquo; vs &ldquo;mi cualidad&rdquo;) between published copies and points out the delay of 39 years before discovery.
                  </p>
                  <div className="mt-3 text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                    Key Authors: Palma, Pascual, Hessel
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="citations"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              <div className="text-xs text-muted-foreground mb-2">
                4 Documented Works in Istifsar Archive Vault:
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    author: 'Schumacher, John N., S.J.',
                    title: 'The Making of a Nation: Essays on Nineteenth-Century Philippine Nationalism',
                    year: '1991',
                    publisher: 'Ateneo de Manila University Press',
                    pages: 'pp. 91-105',
                  },
                  {
                    author: 'Guerrero, Leon Ma.',
                    title: 'The First Filipino: A Biography of José Rizal',
                    year: '1963',
                    publisher: 'National Heroes Commission',
                    pages: 'pp. 420-445',
                  },
                  {
                    author: 'Pascual, Ricardo R.',
                    title: 'Rizal Beyond the Grave: A Critical Study of Jose Rizal’s Retraction',
                    year: '1950',
                    publisher: 'Luzon Publishing House',
                    pages: 'pp. 12-68',
                  },
                ].map((cite, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded bg-card/70 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">
                        {cite.author} ({cite.year})
                      </div>
                      <div className="text-muted-foreground italic font-serif">
                        {cite.title} — <span className="not-italic text-foreground/80">{cite.publisher}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-1 rounded shrink-0 self-start sm:self-center">
                      {cite.pages}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Banner */}
      <div className="px-5 py-3 bg-muted/30 border-t border-border/40 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
        <span>Want to dive deeper into documented Philippine historiography?</span>
        <a
          href="/explore"
          className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
        >
          Explore All Debates &amp; Documents
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </a>
      </div>
    </div>
  );
}

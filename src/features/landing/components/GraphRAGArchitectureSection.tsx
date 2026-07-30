'use client';

import React from 'react';
import { motion } from 'motion/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Share01Icon,
  GitCommitIcon,
  HierarchyIcon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  BookOpen02Icon,
} from '@hugeicons/core-free-icons';

import GraphRAGFlowLines from './GraphRAGFlowLines';
import TiltCard from './TiltCard';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const steps = [
  {
    number: '01',
    icon: HierarchyIcon,
    badge: 'Ingestion & Extraction',
    title: 'Entity & Relationship Extraction',
    description:
      'As manuscripts are ingested, Gemini AI parses full text to extract entities (scholars, events, dates, locations, claims) and directed relationships.',
    details: [
      { label: 'Entities', val: 'HISTORIAN, EVENT, CLAIM, DATE, LOCATION' },
      { label: 'Edges', val: 'ARGUES, CONTRADICTS, CITES, SUPPORTS' },
      { label: 'Deduplication', val: '3072-dim embedding vector matching' },
    ],
    visual: (
      <div className="p-3 sm:p-3.5 rounded-lg bg-background/85 border border-border/60 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 text-amber-600 font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Extracted Graph Nodes</span>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] sm:text-[11px]">
            HISTORIAN: T. Agoncillo
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 text-[10px] sm:text-[11px]">
            EVENT: Tejeros
          </span>
          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] sm:text-[11px]">
            CLAIM: Election Disputes
          </span>
        </div>
      </div>
    ),
  },
  {
    number: '02',
    icon: GitCommitIcon,
    badge: 'Graph Search Engine',
    title: 'Recursive Graph Traversal',
    description:
      'Given a user inquiry, graph_search() traverses relationship edges up to 3 hops away, uncovering multi-hop context and Nodes of Contention across distinct documents.',
    details: [
      { label: 'Traversal', val: 'Recursive CTE graph traversal in PostgreSQL' },
      { label: 'Contention', val: 'Surfaces conflicting scholar perspectives' },
      { label: 'Depth', val: 'Multi-hop relationship link resolution' },
    ],
    visual: (
      <div className="p-3 sm:p-3.5 rounded-lg bg-background/85 border border-border/60 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 text-primary font-semibold">
          <HugeiconsIcon icon={Share01Icon} size={14} />
          <span>Graph Traversal Edge</span>
        </div>
        <div className="p-2 rounded bg-muted/40 text-[10px] sm:text-[11px] text-muted-foreground flex items-center justify-between gap-1 flex-wrap">
          <span className="text-foreground font-semibold">Agoncillo</span>
          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 font-bold text-[10px]">
            CONTRADICTS
          </span>
          <span className="text-foreground font-semibold">Alvarez</span>
        </div>
      </div>
    ),
  },
  {
    number: '03',
    icon: CheckmarkCircle02Icon,
    badge: 'Grounded Retrieval',
    title: 'Tri-Signal RRF Synthesis',
    description:
      'Merges vector search, full-text keywords, and graph proximity using Reciprocal Rank Fusion (RRF) to stream answers strictly backed by cited sources.',
    details: [
      { label: 'RRF Fusion', val: 'pgvector + FTS + Graph Distance' },
      { label: 'Constraint', val: 'Agoncillo reduce-hallucination gate' },
      { label: 'Citations', val: 'Page-level split-pane source chips' },
    ],
    visual: (
      <div className="p-3 sm:p-3.5 rounded-lg bg-background/85 border border-border/60 text-xs font-mono space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 font-semibold">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} />
          <span>Grounded Citation Stream</span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-muted-foreground leading-relaxed">
          &quot;Agoncillo argues that...&quot;
          <span className="ml-1.5 inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded font-mono text-[9px] sm:text-[10px] font-semibold">
            [Agoncillo 1956, p. 112]
          </span>
        </div>
      </div>
    ),
  },
];

export default function GraphRAGArchitectureSection() {
  return (
    <section id="graph-rag" className="py-14 sm:py-24 px-4 sm:px-6 md:px-12 bg-muted/20 border-y border-border/40 scroll-mt-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 sm:px-3.5 py-1 rounded-full mb-3 shadow-sm backdrop-blur-sm">
            <HugeiconsIcon icon={Share01Icon} size={14} />
            <span>Core Engine Architecture</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-4xl md:text-5xl text-foreground mb-3 sm:mb-4">
            How Custom Graph RAG Powers Istifsar AI
          </h2>

          <p className="max-w-2xl mx-auto text-muted-foreground text-xs sm:text-base leading-relaxed px-2">
            Combining vector similarity search, full-text keyword indexing, and knowledge graph traversal for uncompromised historical accuracy.
          </p>
        </motion.div>

        {/* 3-Step Visual Flow Cards with SVG Particle Flow Lines & 3D Tilt */}
        <div className="relative pt-8 sm:pt-10">
          {/* Option 4: Glowing SVG Particle Flow Lines */}
          <GraphRAGFlowLines />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 relative z-10 perspective-1000">
            {steps.map((step, idx) => (
              <motion.div
                key={step.number}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                <TiltCard className="flex flex-col bg-card/95 backdrop-blur-md rounded-xl border border-border/60 p-5 sm:p-6 shadow-sm hover:border-primary/50 hover:shadow-xl transition-all h-full">
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-4 sm:mb-5">
                    <span className="text-xl sm:text-2xl font-mono font-bold text-primary/40 group-hover:text-primary transition-colors">
                      {step.number}
                    </span>
                    <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <HugeiconsIcon icon={step.icon} size={18} />
                    </div>
                  </div>

                  {/* Badge & Title */}
                  <div className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold mb-1">
                    {step.badge}
                  </div>
                  <h3 className="font-heading text-base sm:text-xl text-foreground mb-2.5 sm:mb-3 font-semibold">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 sm:mb-6 flex-1">
                    {step.description}
                  </p>

                  {/* Interactive Visual Box */}
                  <div className="mb-5 sm:mb-6">{step.visual}</div>

                  {/* Detail Spec Rows */}
                  <div className="space-y-2 pt-4 border-t border-border/40 text-xs">
                    {step.details.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-[10px] sm:text-[11px]">
                        <span className="text-muted-foreground font-mono">{d.label}:</span>
                        <span className="text-foreground font-medium text-right font-mono truncate max-w-[140px] sm:max-w-[170px]">
                          {d.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Architecture Summary Banner */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 sm:mt-16 p-4 sm:p-7 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6"
        >
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="p-2.5 sm:p-3 rounded-lg bg-primary text-primary-foreground shrink-0 hidden sm:block">
              <HugeiconsIcon icon={BookOpen02Icon} size={24} />
            </div>
            <div>
              <h4 className="font-heading text-base sm:text-lg font-semibold text-foreground mb-1">
                The Agoncillo Constraint Enforced at Every Layer
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Graph RAG is strictly gated at 0.65 similarity. If no verified document or entity connection exists, the AI returns <em>&quot;No document, no history&quot;</em> and logs the gap.
              </p>
            </div>
          </div>

          <a
            href="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-foreground hover:text-background shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <span>Test Graph Retrieval</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

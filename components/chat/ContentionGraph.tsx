'use client';

import { useState } from 'react';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { ContentionClaim, ContentionMeta } from '@/types/contention';

type Props = {
  contentions: ContentionMeta[];
};

export default function ContentionGraph({ contentions }: Props) {
  return (
    <div className="bg-[#1a1a1c]">
      {contentions.map((c, i) => (
        <NodeGraph key={c.contentionId} contention={c} isFirst={i === 0} />
      ))}
    </div>
  );
}

/* ── Palette ──────────────────────────────────────────────────────────── */

const SCHOLAR_PALETTE = [
  { hex: '#d4af37', dash: '8 4' },
  { hex: '#f2ca50', dash: '4 4' },
  { hex: '#b8963f', dash: '12 4 4 4' },
  { hex: '#e9c349', dash: '6 8' },
  { hex: '#c9a84c', dash: '10 3' },
] as const;

/* ── Position calculator ─────────────────────────────────────────────── */

function getScholarPositions(n: number): Array<{ x: number; y: number }> {
  if (n === 2) {
    return [
      { x: 28, y: 30 },
      { x: 72, y: 70 },
    ];
  }
  if (n === 3) {
    return [
      { x: 50, y: 14 },
      { x: 18, y: 80 },
      { x: 82, y: 80 },
    ];
  }
  if (n === 4) {
    return [
      { x: 50, y: 10 },
      { x: 90, y: 50 },
      { x: 50, y: 90 },
      { x: 10, y: 50 },
    ];
  }
  // n ≥ 5: evenly on a circle around (50, 50), starting at the top
  const R = 40;
  return Array.from({ length: n }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { x: 50 + R * Math.cos(angle), y: 50 + R * Math.sin(angle) };
  });
}

/* ── NodeGraph (one per contention) ──────────────────────────────────── */

function NodeGraph({
  contention,
  isFirst,
}: {
  contention: ContentionMeta;
  isFirst: boolean;
}) {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);

  const { claims } = contention;
  const topicLabel = contention.topic ?? contention.title;
  const isLegacy = claims.length === 0;
  const positions = getScholarPositions(claims.length);

  return (
    <article
      className={cn(
        'relative bg-[#1a1a1c] overflow-visible p-6 sm:p-8',
        'min-h-[420px] sm:min-h-[480px]',
        !isFirst && 'border-t border-gold/10',
      )}
      aria-label={`Node of contention: ${topicLabel}`}
      onClick={() => setActiveTooltipId(null)}
    >
      {/* Edges (absolute SVG overlay, below HTML nodes) */}
      {!isLegacy && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {positions.flatMap((pA, i) =>
            positions.slice(i + 1).map((pB, j) => {
              const idx = i + j + 1;
              const palette = SCHOLAR_PALETTE[i % SCHOLAR_PALETTE.length];
              return (
                <motion.line
                  key={`edge-${claims[i].documentId}-${claims[idx].documentId}`}
                  x1={pA.x}
                  y1={pA.y}
                  x2={pB.x}
                  y2={pB.y}
                  stroke={palette.hex}
                  strokeWidth={1}
                  strokeDasharray={palette.dash}
                  strokeOpacity={0.9}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: 0.25 + i * 0.08,
                    ease: 'easeOut',
                  }}
                />
              );
            }),
          )}
        </svg>
      )}

      {/* Center node */}
      <CenterNode topicLabel={topicLabel} isLegacy={isLegacy} />

      {/* Scholar nodes */}
      {!isLegacy &&
        claims.map((claim, i) => {
          const palette = SCHOLAR_PALETTE[i % SCHOLAR_PALETTE.length];
          const pos = positions[i];
          return (
            <ScholarNode
              key={claim.documentId}
              claim={claim}
              x={pos.x}
              y={pos.y}
              color={palette.hex}
              delay={0.5 + i * 0.12}
              isActive={activeTooltipId === claim.documentId}
              onToggle={() =>
                setActiveTooltipId((prev) =>
                  prev === claim.documentId ? null : claim.documentId,
                )
              }
            />
          );
        })}

    </article>
  );
}

/* ── Center node (book glyph + topic label) ──────────────────────────── */

function CenterNode({
  topicLabel,
  isLegacy,
}: {
  topicLabel: string;
  isLegacy: boolean;
}) {
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 120, damping: 14 }}
    >
      <div
        className={cn(
          'w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gold flex items-center justify-center',
          'border-4 border-surface-elevated shadow-[0_0_15px_rgba(212,175,55,0.3)]',
        )}
      >
        <svg
          className="w-7 h-7 sm:w-9 sm:h-9 text-surface-vault"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
        </svg>
      </div>

      <div className="mt-4 bg-[#1a1a1c] px-6 py-2 border border-gold/50 rounded-sm text-center max-w-[240px] sm:max-w-[280px]">
        <h3 className="font-serif text-sm font-bold text-gold leading-snug">
          {topicLabel}
        </h3>
        <span className="text-[9px] uppercase tracking-tighter text-zinc-400 block mt-1">
          Contested Topic
        </span>
      </div>

      {isLegacy && (
        <span className="mt-4 text-[10px] text-zinc-500 uppercase tracking-widest">
          Legacy contention — upgrade pending
        </span>
      )}
    </motion.div>
  );
}

/* ── Scholar node (person icon + name + tooltip) ─────────────────────── */

function ScholarNode({
  claim,
  x,
  y,
  color,
  delay,
  isActive,
  onToggle,
}: {
  claim: ContentionClaim;
  x: number;
  y: number;
  color: string;
  delay: number;
  isActive: boolean;
  onToggle: () => void;
}) {
  const flipBelow = y < 30;
  const flipLeft = x > 75;
  const flipRight = x < 25;

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay, type: 'spring', stiffness: 130, damping: 12 }}
    >
      <div
        className="group relative flex flex-col items-center cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={`${claim.scholarName}: view claim`}
        aria-describedby={`tooltip-${claim.documentId}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div
          className={cn(
            'w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-surface-elevated border-[1.5px]',
            'flex items-center justify-center transition-transform hover:scale-110',
            'shadow-[0_0_8px_rgba(212,175,55,0.1)]',
            'group-focus-visible:ring-2 group-focus-visible:ring-gold/60',
          )}
          style={{ borderColor: color }}
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7"
            fill={color}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" />
          </svg>
        </div>

        <span className="mt-3 font-serif text-[11px] sm:text-xs text-zinc-200 text-center max-w-[140px] truncate">
          {claim.scholarName}
        </span>

        {/* Tooltip */}
        <div
          id={`tooltip-${claim.documentId}`}
          role="tooltip"
          className={cn(
            'absolute w-[min(14rem,calc(100vw-3rem))] p-4 z-30',
            'bg-surface-elevated border border-gold/20 rounded-sm shadow-2xl',
            'transition-opacity duration-200',
            flipBelow ? 'top-full mt-3' : 'bottom-[calc(100%+0.75rem)]',
            flipLeft
              ? 'right-0 translate-x-0'
              : flipRight
                ? 'left-0 translate-x-0'
                : 'left-1/2 -translate-x-1/2',
            isActive
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none',
            'md:group-hover:opacity-100 md:group-hover:pointer-events-auto',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-serif italic text-xs text-zinc-200 leading-loose">
            &ldquo;{claim.claim}&rdquo;
          </p>

          {/* Arrow */}
          <span
            className={cn(
              'absolute w-3 h-3 bg-surface-elevated rotate-45',
              flipLeft
                ? 'right-4'
                : flipRight
                  ? 'left-4'
                  : 'left-1/2 -translate-x-1/2',
              flipBelow
                ? 'bottom-full -mb-1.5 border-l border-t border-gold/20'
                : 'top-full -mt-1.5 border-r border-b border-gold/20',
            )}
          />
        </div>
      </div>
    </motion.div>
  );
}

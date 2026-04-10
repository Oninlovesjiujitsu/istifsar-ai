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
  { hex: '#D4AF37', dash: undefined },   // 0: solid gold
  { hex: '#F59E0B', dash: '4 4' },       // 1: dashed amber
  { hex: '#B45309', dash: '2 3' },       // 2: dotted bronze
  { hex: '#854D0E', dash: '6 3 2 3' },   // 3: dash-dot umber
  { hex: '#EAB308', dash: '5 2' },       // 4: dashed yellow
] as const;

/* ── Position calculator ─────────────────────────────────────────────── */

function getScholarPositions(n: number): Array<{ x: number; y: number }> {
  if (n === 2) {
    return [
      { x: 22, y: 28 },
      { x: 78, y: 72 },
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
    >
      {/* Edges (absolute SVG overlay, below HTML nodes) */}
      {!isLegacy && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {positions.map((p, i) => {
            const palette = SCHOLAR_PALETTE[i % SCHOLAR_PALETTE.length];
            return (
              <motion.line
                key={`edge-${claims[i].documentId}`}
                x1={50}
                y1={50}
                x2={p.x}
                y2={p.y}
                stroke={palette.hex}
                strokeWidth={0.4}
                strokeDasharray={palette.dash}
                strokeOpacity={0.7}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  duration: 0.7,
                  delay: 0.25 + i * 0.08,
                  ease: 'easeOut',
                }}
              />
            );
          })}
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
              onClose={() => setActiveTooltipId(null)}
            />
          );
        })}
    </article>
  );
}

/* ── Center node (scales-of-justice + topic label) ───────────────────── */

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
          'w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold flex items-center justify-center',
          'border-4 border-surface-elevated shadow-[0_0_15px_rgba(212,175,55,0.3)]',
        )}
      >
        <svg
          className="w-7 h-7 sm:w-9 sm:h-9 text-surface-vault"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 0 1-2.031.352 5.988 5.988 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971Zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0 2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 0 1-2.031.352 5.989 5.989 0 0 1-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971Z"
          />
        </svg>
      </div>

      <div className="mt-4 bg-surface-elevated/90 backdrop-blur-sm px-4 py-2 border border-gold/30 text-center max-w-[240px] sm:max-w-[280px]">
        <span className="text-[9px] uppercase tracking-tighter text-zinc-400 block">
          Contested Topic
        </span>
        <h3 className="font-serif text-sm font-bold text-gold leading-snug">
          {topicLabel}
        </h3>
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
  onClose,
}: {
  claim: ContentionClaim;
  x: number;
  y: number;
  color: string;
  delay: number;
  isActive: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const flipBelow = y < 30;

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
        onClick={onToggle}
      >
        <div
          className={cn(
            'w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-elevated border-2',
            'flex items-center justify-center transition-transform hover:scale-110',
          )}
          style={{ borderColor: color }}
        >
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke={color}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>

        <span className="mt-3 font-serif text-[11px] sm:text-xs text-zinc-200 text-center max-w-[140px] truncate">
          {claim.scholarName}
        </span>

        {/* Tooltip */}
        <div
          className={cn(
            'absolute left-1/2 -translate-x-1/2 w-56 sm:w-64 p-4 z-30',
            'bg-surface-elevated border border-gold/20 rounded-sm shadow-2xl',
            'transition-all duration-200',
            flipBelow ? 'top-full mt-3' : 'bottom-[calc(100%+0.75rem)]',
            isActive
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-95 pointer-events-none',
            'md:group-hover:opacity-100 md:group-hover:scale-100 md:group-hover:pointer-events-auto',
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <header className="flex justify-between items-start mb-2 gap-2">
            <span className="text-[9px] uppercase tracking-widest text-gold font-bold">
              Scholarly Claim
            </span>
            <button
              type="button"
              className="text-zinc-500 hover:text-gold transition-colors shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              aria-label="Close claim"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          <p className="font-serif italic text-xs text-zinc-200 leading-relaxed">
            &ldquo;{claim.claim}&rdquo;
          </p>

          {claim.excerpt && (
            <p className="mt-2 border-l-2 border-gold/30 pl-3 text-[11px] text-zinc-400 italic line-clamp-3">
              &ldquo;{claim.excerpt}&rdquo;
            </p>
          )}

          <span className="mt-3 block text-[9px] uppercase tracking-widest text-zinc-500 truncate">
            {claim.documentTitle}
          </span>

          {/* Arrow */}
          <span
            className={cn(
              'absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-surface-elevated rotate-45',
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

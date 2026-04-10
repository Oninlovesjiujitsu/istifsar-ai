'use client';

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { ContentionClaim, ContentionMeta } from '@/types/contention';
import { cn } from '@/lib/utils';

type Props = {
  contentions: ContentionMeta[];
};

export default function ContentionCards({ contentions }: Props) {
  return (
    <div className="px-4 py-3 space-y-3 bg-[#1a1a1c]">
      {contentions.map((c) => (
        <VersusTile key={c.contentionId} contention={c} />
      ))}
    </div>
  );
}

/** Turn a display name into up to two initials ("Teodoro Agoncillo" → "TA"). */
function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function VersusTile({ contention: c }: { contention: ContentionMeta }) {
  const [excerptsOpen, setExcerptsOpen] = useState(false);
  const panelId = useId();

  const topicLine = c.topic ?? c.title;
  const hasClaims = c.claims.length > 0;
  const isTwoWay = c.claims.length === 2;
  const hasExcerpts = c.claims.some((cl) => !!cl.excerpt);

  return (
    <article
      className="bg-surface-vault/50 border border-gold/20 rounded-sm p-4"
      aria-label={`Disagreement: ${topicLine}`}
    >
      {/* Header */}
      <header className="flex items-baseline gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-widest text-gold font-bold">
          Scholarly Disagreement
        </span>
        <span className="text-xs text-zinc-500">·</span>
        <p className="text-sm font-serif text-zinc-200">
          <span className="text-zinc-500">On:</span>{' '}
          <span className="italic">{topicLine}</span>
        </p>
      </header>

      {/* Legacy fallback: no claims yet (pre-migration rows) */}
      {!hasClaims && (
        <LegacyBody contention={c} />
      )}

      {/* 2-way versus layout */}
      {hasClaims && isTwoWay && (
        <TwoWayBody claims={c.claims} />
      )}

      {/* 3+-way fallback: vertical list of scholar rows */}
      {hasClaims && !isTwoWay && (
        <MultiWayBody claims={c.claims} />
      )}

      {/* Actions row */}
      {hasClaims && hasExcerpts && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setExcerptsOpen((prev) => !prev)}
            aria-expanded={excerptsOpen}
            aria-controls={panelId}
            className="inline-flex items-center gap-1.5 rounded-sm border border-gold/20 bg-gold/5 px-3 py-1.5 text-[11px] uppercase tracking-wider text-gold hover:bg-gold/10 hover:border-gold/40 transition-colors"
          >
            <svg
              className={cn(
                'w-3 h-3 shrink-0 transition-transform',
                excerptsOpen && 'rotate-180',
              )}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
            {excerptsOpen ? 'Hide excerpts' : 'Read excerpts'}
          </button>
        </div>
      )}

      {/* Excerpts panel */}
      <AnimatePresence initial={false}>
        {excerptsOpen && hasExcerpts && (
          <motion.div
            id={panelId}
            key="excerpts"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3 border-t border-gold/10 pt-3">
              {c.claims
                .filter((cl) => !!cl.excerpt)
                .map((cl) => (
                  <figure key={cl.documentId} className="space-y-1">
                    <blockquote className="border-l-2 border-gold/30 pl-3 text-xs leading-relaxed text-zinc-300 font-serif italic">
                      &ldquo;{cl.excerpt}&rdquo;
                    </blockquote>
                    <figcaption className="pl-3 text-[10px] uppercase tracking-widest text-zinc-500">
                      {cl.scholarName}
                      <span className="text-zinc-600"> · </span>
                      <span className="italic normal-case tracking-normal">{cl.documentTitle}</span>
                    </figcaption>
                  </figure>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

/* ─── Layouts ───────────────────────────────────────────────────────────── */

function TwoWayBody({ claims }: { claims: ContentionClaim[] }) {
  const [a, b] = claims;

  return (
    <div className="mt-4">
      {/* Desktop: horizontal versus. Mobile (<sm): stacked with rotated glyph. */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
        <ScholarColumn claim={a} align="right" />
        <VersusGlyph />
        <ScholarColumn claim={b} align="left" />
      </div>
      <div className="sm:hidden flex flex-col items-stretch gap-3">
        <ScholarColumn claim={a} align="center" />
        <VersusGlyph vertical />
        <ScholarColumn claim={b} align="center" />
      </div>
    </div>
  );
}

function MultiWayBody({ claims }: { claims: ContentionClaim[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {claims.map((cl) => (
        <li key={cl.documentId} className="flex items-start gap-3">
          <InitialsBubble name={cl.scholarName} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-serif text-zinc-100 truncate">{cl.scholarName}</p>
            <p className="text-xs text-zinc-400 italic truncate">{cl.documentTitle}</p>
            <p className="mt-1 text-sm font-serif text-zinc-200">
              &ldquo;{cl.claim}&rdquo;
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function LegacyBody({ contention: c }: { contention: ContentionMeta }) {
  return (
    <div className="mt-3 space-y-3">
      {c.description && (
        <p className="text-sm font-serif text-zinc-300 leading-relaxed">{c.description}</p>
      )}
      {c.scholarNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {c.scholarNames.map((name, i) => (
            <span
              key={`${c.contentionId}-legacy-${i}`}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border border-gold/30 bg-gold/10 text-gold"
            >
              <InitialsBubble name={name} size="xs" />
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Building blocks ───────────────────────────────────────────────────── */

function ScholarColumn({
  claim,
  align,
}: {
  claim: ContentionClaim;
  align: 'left' | 'right' | 'center';
}) {
  const alignCls =
    align === 'left'
      ? 'items-start text-left'
      : align === 'right'
        ? 'items-end text-right'
        : 'items-center text-center';

  return (
    <div className={cn('flex flex-col min-w-0', alignCls)}>
      <InitialsBubble name={claim.scholarName} />
      <p className="mt-2 text-sm font-serif text-zinc-100 truncate max-w-full">
        {claim.scholarName}
      </p>
      <p className="text-xs text-zinc-400 italic truncate max-w-full">
        {claim.documentTitle}
      </p>
      <p className="mt-2 text-sm font-serif text-zinc-200 leading-snug">
        &ldquo;{claim.claim}&rdquo;
      </p>
    </div>
  );
}

function InitialsBubble({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'xs' | 'md';
}) {
  const dims =
    size === 'xs'
      ? 'w-4 h-4 text-[8px]'
      : 'w-12 h-12 md:w-14 md:h-14 text-base md:text-lg';

  return (
    <div
      aria-hidden="true"
      className={cn(
        'rounded-full flex items-center justify-center border border-gold/40 bg-gold/10 text-gold font-serif font-bold shrink-0',
        dims,
      )}
    >
      {toInitials(name)}
    </div>
  );
}

function VersusGlyph({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-center select-none',
        vertical ? 'py-1' : 'pt-4',
      )}
      aria-hidden="true"
    >
      <span
        className={cn(
          'text-2xl md:text-3xl text-gold/40 font-serif',
          vertical && 'rotate-90 inline-block',
        )}
      >
        ⚔
      </span>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';

/**
 * Two-layer bookshelf silhouette band along the viewport's bottom edge.
 * Evokes the atmosphere of standing inside an ancient, grand library or archives vault.
 * Integrates with the project's custom theme using Tailwind color overlays.
 */
export default function ArchiveBookshelfSilhouette() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 right-0 bottom-0 pointer-events-none z-10 select-none transition-opacity duration-700"
      style={{ height: '22vh' }}
    >
      <svg
        viewBox="0 0 1200 300"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          {/* Subtle gradient to fade the top of the bookshelf into the background */}
          <linearGradient id="shelfFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="30%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ==================== BACK LAYER ==================== */}
        {/* Taller, thinner books forming a distant bookshelf backdrop */}
        <path
          d="M0,300 L0,130 L25,130 L25,145 L65,145 L65,105 L105,105 L105,155 L135,155 L135,135 L175,135 L175,125 L205,125 L205,165 L235,165 L235,110 L275,110 L275,130 L335,130 L335,150 L375,150 L375,120 L425,120 L425,140 L465,140 L465,100 L515,100 L515,155 L555,155 L555,115 L595,115 L595,135 L645,135 L645,120 L695,120 L695,160 L735,160 L735,125 L785,125 L785,140 L835,140 L835,105 L885,105 L885,150 L925,150 L925,115 L975,115 L975,135 L1025,135 L1025,155 L1075,155 L1075,120 L1125,120 L1125,145 L1200,145 L1200,300 Z"
          className="fill-gold/15 dark:fill-gold/10"
        />

        {/* ==================== FRONT LAYER ==================== */}
        {/* Denser books, leaning folios, stacks, and library elements */}
        <path
          d="M0,300 L0,185 L35,185 L35,200 L85,200 L85,175 L135,175 L135,215 L175,215 L175,190 L200,190 L245,170 L260,210 L275,210 L275,195 L325,195 L325,205 L375,205 L375,215 L325,215 L325,225 L385,225 L385,190 L425,190 L425,165 L475,165 L475,210 L525,210 L525,175 L575,175 L575,195 L615,195 L615,180 L665,180 L665,215 L705,215 L705,185 L750,165 L765,205 L795,205 L795,190 L845,190 L845,200 L895,200 L895,210 L845,210 L845,220 L905,220 L905,180 L955,180 L955,195 L1005,195 L1005,175 L1055,175 L1055,210 L1105,210 L1105,185 L1145,185 L1200,195 L1200,300 Z"
          className="fill-gold/30 dark:fill-gold/20"
        />

        {/* ==================== SHELF BASE ==================== */}
        {/* Solid wood/stone shelf board with bevel details */}
        <rect
          x="0"
          y="275"
          width="1200"
          height="12"
          className="fill-gold/45 dark:fill-gold/30"
        />
        <rect
          x="0"
          y="287"
          width="1200"
          height="13"
          className="fill-gold/25 dark:fill-gold/15"
        />
      </svg>

      {/* Shadow gradient overlap to ensure clean bottom integration with page background */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

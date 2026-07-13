'use client';

import { useEffect, useMemo, useState } from 'react';

type WanderVariant = 1 | 2 | 3;

interface Particle {
  id: number;
  x: number;          // % horizontal start
  y: number;          // % vertical start
  delay: number;      // s
  duration: number;   // s
  size: number;       // px
  wanderVariant: WanderVariant; // for fireflies
}

const PARTICLE_COUNT = 22;

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 12,
    duration: Math.random() * 14 + 10,
    size: Math.random() * 14 + 14, // 14px to 28px
    wanderVariant: ((i % 3) + 1) as WanderVariant,
  }));
}

// Archival Dust Mote — slow-drifting, soft blurred particle
function DustMote() {
  return (
    <svg viewBox="0 0 24 24" width="100%" height="100%" className="blur-[1px]">
      <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.25" />
      <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.5" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export default function FireFlyBackground({ className = 'z-20' }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const particles = useMemo(() => makeParticles(), []);

  if (!mounted || reducedMotion) return null;

  return (
    <div aria-hidden="true" className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((p) => {
        const sizeStyle: React.CSSProperties = {
          width: `${p.size}px`,
          height: `${p.size}px`,
          left: `${p.x}%`,
          top: `${p.y}%`,
          // Negative delay = enter mid-animation (no frozen start frame on mount)
          animationDelay: `-${p.delay}s`,
          animationDuration: `${p.duration + 4}s`,
        };

        return (
          <span
            key={p.id}
            aria-hidden="true"
            className={`absolute seasonal-particle firefly-wander-${p.wanderVariant}`}
            style={{
              ...sizeStyle,
              color: 'hsl(var(--primary) / 0.25)', // Faint sepia dust motes in the library light
            }}
          >
            <DustMote />
          </span>
        );
      })}
    </div>
  );
}

'use client';

import React, { useRef } from 'react';

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
};

export default function TiltCard({ children, className = '' }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    cardRef.current.style.setProperty('--spot-x', `${px}%`);
    cardRef.current.style.setProperty('--spot-y', `${py}%`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative group transition-all duration-300 hover:-translate-y-1 ${className}`}
      style={
        {
          '--spot-x': '50%',
          '--spot-y': '50%',
        } as React.CSSProperties
      }
    >
      {/* Light sheen overlay following cursor */}
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(350px circle at var(--spot-x) var(--spot-y), hsl(var(--primary) / 0.12), transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}

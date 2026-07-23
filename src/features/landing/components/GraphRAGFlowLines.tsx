'use client';

import React from 'react';

export default function GraphRAGFlowLines() {
  return (
    <div className="hidden md:block absolute inset-x-0 -top-8 pointer-events-none z-20 px-8">
      <svg
        className="w-full h-20 overflow-visible"
        viewBox="0 0 1000 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Flow Gradient for Glowing Arches */}
          <linearGradient id="flowGradArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glowArc" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Step 1 -> Step 2 Arc Curve */}
        <path
          d="M 280 65 C 330 10, 420 10, 470 65"
          stroke="url(#flowGradArc)"
          strokeWidth="3"
          strokeDasharray="6 6"
          filter="url(#glowArc)"
        />

        {/* Step 2 -> Step 3 Arc Curve */}
        <path
          d="M 610 65 C 660 10, 750 10, 800 65"
          stroke="url(#flowGradArc)"
          strokeWidth="3"
          strokeDasharray="6 6"
          filter="url(#glowArc)"
        />

        {/* Animated Particle Dots moving along Arches */}
        <circle r="5" fill="hsl(var(--primary))" filter="url(#glowArc)">
          <animateMotion
            path="M 280 65 C 330 10, 420 10, 470 65"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle r="5" fill="hsl(var(--primary))" filter="url(#glowArc)">
          <animateMotion
            path="M 610 65 C 660 10, 750 10, 800 65"
            dur="2.8s"
            begin="0.9s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {/* Floating Gap Badges showing pipeline data flow */}
      <div className="absolute top-1 left-[34%] -translate-x-1/2 flex items-center gap-1.5 bg-background/90 border border-primary/30 text-primary text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
        <span>Graph Traversal →</span>
      </div>

      <div className="absolute top-1 left-[67%] -translate-x-1/2 flex items-center gap-1.5 bg-background/90 border border-primary/30 text-primary text-[10px] font-mono px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
        <span>RRF Synthesis →</span>
      </div>
    </div>
  );
}

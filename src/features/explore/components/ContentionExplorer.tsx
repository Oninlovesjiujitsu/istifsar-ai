'use client';

import React, { useState, useEffect } from 'react';
import ContentionGraph from '@/src/features/chat/components/ContentionGraph';
import type { ContentionMeta } from '@/src/types/contention';

type Props = {
  contentions: ContentionMeta[];
};

export default function ContentionExplorer({ contentions }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  return (
    <section className="flex flex-col mb-12 sm:mb-16">
      <header className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-heading text-foreground leading-tight flex items-center gap-2">
          <span>The Contention Map</span>
          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary uppercase tracking-wider align-middle">
            Live
          </span>
        </h2>
        <p className="mt-2 text-muted-foreground max-w-2xl text-sm sm:text-base">
          Explore the active debates and unresolved historical nodes currently being investigated by the community. Hover over scholars to see their claims.
        </p>
      </header>

      <div className="w-full rounded-xl border-2 border-border/60 bg-card overflow-hidden shadow-sm relative group">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
        {contentions.length > 0 ? (
          <div className="w-full flex flex-col transition-opacity duration-300" style={{ height: mounted ? (isMobile ? '500px' : '600px') : '600px', opacity: mounted ? 1 : 0 }}>
            {mounted && <ContentionGraph contentions={contentions} layout={isMobile ? "vertical" : "horizontal"} interactive={true} isMobile={isMobile} />}
          </div>
        ) : (
          <div className="h-[400px] w-full flex flex-col items-center justify-center p-8 text-center bg-muted/20">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
              <svg className="w-8 h-8 text-primary/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>
            </div>
            <h3 className="text-lg font-serif text-foreground mb-2">No Active Contentions</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              The archive currently has a consensus on all topics. Check back later when new debates emerge.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

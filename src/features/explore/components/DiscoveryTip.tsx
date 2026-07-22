'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SAMPLE_PROMPTS = [
  'Primary accounts of Ottoman trade routes in the Mediterranean',
  'How manuscript translation houses operated in 9th-century Baghdad',
  'Andalusian architectural influences across North Africa',
  'Land tenure records during the Mamluk Sultanate',
];

export default function DiscoveryTip() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      router.push('/explore/new');
      return;
    }
    router.push(`/explore/new?q=${encodeURIComponent(query.trim())}`);
  }

  function handlePromptClick(promptText: string) {
    router.push(`/explore/new?q=${encodeURIComponent(promptText)}`);
  }

  return (
    <div className="relative overflow-hidden bg-card/60 p-6 sm:p-8 lg:p-10 rounded-sm border border-border backdrop-blur-md shadow-lg">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center justify-between">
        <div className="max-w-2xl flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] uppercase tracking-[0.2em] font-semibold mb-4">
            <svg
              className="w-3.5 h-3.5 text-primary animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
            Ask the Archive
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-foreground leading-snug mb-3">
            Have a specific historical question?
          </h3>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
            Search across indexed manuscripts, historical primary sources, and peer-reviewed scholarly writings with AI synthesis.
          </p>

          {/* Quick Inquiry Search Box */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about historical events, trade routes, scholars, or manuscripts..."
                className="w-full bg-background border border-border focus:border-primary/50 rounded-md px-4 py-3 pr-28 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-4 py-2 bg-primary text-primary-foreground font-semibold text-xs rounded-sm hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
              >
                Inquire
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </form>

          {/* Prompt Chips */}
          <div>
            <span className="block text-[11px] text-muted-foreground font-medium mb-2.5 uppercase tracking-wider">
              Or try a sample historical inquiry:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(promptText)}
                  className="text-xs bg-muted/60 hover:bg-primary/10 text-muted-foreground hover:text-primary border border-border hover:border-primary/30 rounded-full px-3 py-1.5 transition-all text-left group"
                >
                  <span className="text-primary/60 group-hover:text-primary mr-1">&ldquo;</span>
                  {promptText}
                  <span className="text-primary/60 group-hover:text-primary ml-1">&rdquo;</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 pt-6 lg:pt-0 border-t lg:border-t-0 lg:border-l border-border lg:pl-8">
          <Link
            href="/explore/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-primary text-primary-foreground font-semibold text-xs tracking-wider uppercase hover:bg-primary/90 transition-all shadow-sm"
          >
            Start AI Inquiry
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-muted text-foreground hover:bg-accent border border-border font-medium text-xs tracking-wider uppercase transition-all"
          >
            View Discovery Hub
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}



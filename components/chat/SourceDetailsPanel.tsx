'use client';

import { useState } from 'react';
import type { CitationData } from './MessageBubble';
import HistorianProfileModal from './HistorianProfileModal';

type Props = {
  citation: CitationData;
  onClose: () => void;
};
// Implementation of Split-Pane Viewer
export default function SourceDetailsPanel({ citation, onClose }: Props) {
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-surface-vault">
      <div className="flex items-center justify-between px-6 lg:px-8 py-5 bg-surface-elevated shrink-0">
        <h2 className="font-heading text-gold text-lg lg:text-xl font-black italic tracking-tight">
          Source Details
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted-vault hover:text-gold transition-colors"
          aria-label="Close source panel"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18 18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-6 lg:p-8 gap-6">
        <div className="shrink-0 space-y-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold">
            Metadata Identification
          </span>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <div className="text-[10px] text-text-muted-vault uppercase mb-1">
                Document Title
              </div>
              <div className="font-heading text-lg text-white leading-tight">
                {citation.documentTitle}
              </div>
            </div>
            {citation.documentDate && (
              <div>
                <div className="text-[10px] text-text-muted-vault uppercase mb-1">
                  Dating
                </div>
                <div className="font-heading text-white">
                  {citation.documentDate}
                </div>
              </div>
            )}
            {citation.authorDisplayName && (
              <div>
                <div className="text-[10px] text-text-muted-vault uppercase mb-1">
                  Author
                </div>
                <button
                  type="button"
                  onClick={() => setProfileUsername(citation.authorUsername)}
                  className="group flex items-center gap-2 text-left"
                >
                  <span className="font-heading text-white group-hover:text-gold transition-colors">
                    {citation.authorDisplayName}
                  </span>
                  <svg
                    className="w-3.5 h-3.5 text-gold/40 group-hover:text-gold transition-colors shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-bold mb-4 block shrink-0">
            Archival Fragment
          </span>
          <div className="flex-1 min-h-0 parchment-texture bg-[#0e0e0e] rounded-sm relative flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto vault-scrollbar p-6 pb-0">
              <div className="text-zinc-400 leading-relaxed font-light text-sm first-letter:text-3xl first-letter:font-heading first-letter:text-gold first-letter:mr-1 first-letter:float-left">
                {citation.excerpt}
              </div>
            </div>

            <div className="shrink-0 mx-6 mt-4 mb-6 pt-4 border-t border-gold/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <span className="text-[10px] text-zinc-600 font-mono italic">
                Relevance: {(citation.score * 100).toFixed(0)}%
              </span>
              <a
                href={`/documents/${citation.documentId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform"
              >
                View Original Document
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {profileUsername && (
        <HistorianProfileModal
          username={profileUsername}
          onClose={() => setProfileUsername(null)}
        />
      )}
    </div>
  );
}

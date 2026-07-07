'use client';

import ContentionGraph from './ContentionGraph';
import type { ContentionMeta } from '@/types/contention';

type Props = {
  contentions: ContentionMeta[];
  onClose: () => void;
};

export default function ContentionCanvasPanel({ contentions, onClose }: Props) {
  return (
    <div className="flex flex-col h-full bg-surface-vault">
      <div className="flex items-center justify-between px-6 lg:px-8 py-5 bg-surface-elevated shrink-0">
        <h2 className="font-heading text-gold text-lg lg:text-xl font-black italic tracking-tight">
          Nodes of Contention
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted-vault hover:text-gold transition-colors"
          aria-label="Close contention canvas"
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

      <div className="flex-1 min-h-0 overflow-y-auto vault-scrollbar">
        <ContentionGraph contentions={contentions} />
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import LensSelector from './LensSelector';

type Props = {
  mode: 'scholarly_consensus' | 'scholar_lens';
  onChange: (mode: 'scholarly_consensus' | 'scholar_lens', essayId?: string) => void;
  disabled?: boolean;
};

export default function ModeToggle({ mode, onChange, disabled }: Props) {
  const [showLensSelector, setShowLensSelector] = useState(false);

  function handleSwitch(next: 'scholarly_consensus' | 'scholar_lens') {
    if (next === mode) return;

    if (next === 'scholar_lens') {
      setShowLensSelector(true);
      return;
    }

    onChange(next);
  }

  return (
    <>
      <div
        className="inline-flex rounded-lg border border-border bg-muted p-0.5 text-xs"
        role="group"
        aria-label="Response mode"
      >
        <button
          type="button"
          onClick={() => handleSwitch('scholarly_consensus')}
          disabled={disabled}
          aria-pressed={mode === 'scholarly_consensus'}
          className={[
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            mode === 'scholarly_consensus'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled ? 'pointer-events-none opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          Scholarly Consensus
        </button>
        <button
          type="button"
          onClick={() => handleSwitch('scholar_lens')}
          disabled={disabled}
          aria-pressed={mode === 'scholar_lens'}
          className={[
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            mode === 'scholar_lens'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled ? 'pointer-events-none opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          Scholar&apos;s Perspective
        </button>
      </div>

      {showLensSelector && (
        <LensSelector
          onSelect={(essayId) => {
            setShowLensSelector(false);
            onChange('scholar_lens', essayId);
          }}
          onCancel={() => setShowLensSelector(false)}
        />
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import LensSelector from './LensSelector';

type Props = {
  mode: 'raw_evidence' | 'interpreted';
  onChange: (mode: 'raw_evidence' | 'interpreted', essayId?: string) => void;
  disabled?: boolean;
};

/**
 * Two-button toggle for switching between Raw Evidence and Historian's Perspective
 * (Interpreted) mode. Switching to Interpreted opens the LensSelector to pick
 * a Living Essay before creating the conversation.
 */
export default function ModeToggle({ mode, onChange, disabled }: Props) {
  const [showLensSelector, setShowLensSelector] = useState(false);

  function handleSwitch(next: 'raw_evidence' | 'interpreted') {
    if (next === mode) return;

    if (next === 'interpreted') {
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
          onClick={() => handleSwitch('raw_evidence')}
          disabled={disabled}
          aria-pressed={mode === 'raw_evidence'}
          className={[
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            mode === 'raw_evidence'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled ? 'pointer-events-none opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          Raw Evidence
        </button>
        <button
          type="button"
          onClick={() => handleSwitch('interpreted')}
          disabled={disabled}
          aria-pressed={mode === 'interpreted'}
          className={[
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            mode === 'interpreted'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
            disabled ? 'pointer-events-none opacity-50' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          Historian&apos;s Perspective
        </button>
      </div>

      {showLensSelector && (
        <LensSelector
          onSelect={(essayId) => {
            setShowLensSelector(false);
            onChange('interpreted', essayId);
          }}
          onCancel={() => setShowLensSelector(false)}
        />
      )}
    </>
  );
}

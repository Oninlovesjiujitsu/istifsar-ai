'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type Essay = {
  id: string;
  title: string;
  lens_label: string | null;
};

type Props = {
  onSelect: (essayId: string) => void;
  onCancel: () => void;
};

/**
 * Modal-style selector for choosing a Living Essay as a lens.
 * Shown when the user switches to Interpreted (Historian's Perspective) mode.
 */
export default function LensSelector({ onSelect, onCancel }: Props) {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('living_essays')
      .select('id, title, lens_label')
      .eq('status', 'published')
      .order('title')
      .then(({ data }) => {
        setEssays(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <h3 className="text-lg font-heading text-foreground mb-1">
          Choose a Historian&apos;s Lens
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Select a published essay to use as a perspective. This starts a new
          conversation — your current messages won&apos;t carry over.
        </p>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading essays...
          </div>
        ) : essays.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No published essays available yet.
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
            {essays.map((essay) => (
              <button
                key={essay.id}
                type="button"
                onClick={() => setSelectedId(essay.id)}
                className={[
                  'w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors',
                  selectedId === essay.id
                    ? 'bg-gold/10 border border-gold/40 text-foreground'
                    : 'hover:bg-muted text-foreground',
                ].join(' ')}
              >
                <span className="font-medium">{essay.title}</span>
                {essay.lens_label && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({essay.lens_label})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedId || loading}
            onClick={() => selectedId && onSelect(selectedId)}
          >
            Use this lens
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

type Props = {
  eras: string[];
  geographies: string[];
  subjects: string[];
};

export default function BountyFilters({ eras, geographies, subjects }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentEra = searchParams.get('era') ?? '';
  const currentGeo = searchParams.get('geography') ?? '';
  const currentSubject = searchParams.get('subject') ?? '';
  const hasFilters = !!(currentEra || currentGeo || currentSubject);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`/bounty?${params.toString()}`);
    },
    [router, searchParams],
  );

  if (eras.length === 0 && geographies.length === 0 && subjects.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {eras.length > 0 && (
        <select
          value={currentEra}
          onChange={(e) => updateParam('era', e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All eras</option>
          {eras.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      )}
      {geographies.length > 0 && (
        <select
          value={currentGeo}
          onChange={(e) => updateParam('geography', e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All regions</option>
          {geographies.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      )}
      {subjects.length > 0 && (
        <select
          value={currentSubject}
          onChange={(e) => updateParam('subject', e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground"
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      )}
      {hasFilters && (
        <button
          onClick={() => router.push('/bounty')}
          className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

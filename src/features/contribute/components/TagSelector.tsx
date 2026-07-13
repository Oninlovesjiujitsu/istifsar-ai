'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

export interface TagOption {
  id: string;
  name: string;
  isNew?: boolean;
}

export default function TagSelector({
  selected,
  onChange,
}: {
  selected: TagOption[];
  onChange: (tags: TagOption[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<TagOption[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch existing tags once on mount
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('tags')
      .select('id, name')
      .order('name')
      .then(({ data }) => {
        if (data) setOptions(data.map((t) => ({ id: t.id, name: t.name })));
      });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const trimmed = query.trim();
  const lowerQuery = trimmed.toLowerCase();

  const filtered = options.filter(
    (o) =>
      o.name.toLowerCase().includes(lowerQuery) &&
      !selected.some((s) => s.id === o.id),
  );

  const exactMatch =
    options.some((o) => o.name.toLowerCase() === lowerQuery) ||
    selected.some((s) => s.name.toLowerCase() === lowerQuery);

  const showCreate = trimmed.length > 0 && !exactMatch;

  const items = [
    ...filtered,
    ...(showCreate ? [{ id: `__new__`, name: trimmed, isNew: true }] : []),
  ];

  function addTag(tag: TagOption) {
    if (tag.isNew) {
      // Generate a temporary id for new tags
      onChange([...selected, { id: `new:${tag.name}`, name: tag.name, isNew: true }]);
    } else {
      onChange([...selected, tag]);
    }
    setQuery('');
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function removeTag(id: string) {
    onChange(selected.filter((t) => t.id !== id));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      removeTag(selected[selected.length - 1].id);
      return;
    }

    if (!open || items.length === 0) {
      if (e.key === 'Enter') e.preventDefault();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = activeIndex >= 0 ? items[activeIndex] : items[0];
      if (target) addTag(target);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Selected tags + input */}
      <div
        className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background shadow-[inset_1px_1px_3px_rgba(0,0,0,0.06)] px-2 py-1.5 text-sm focus-within:ring-1 focus-within:ring-primary"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-md bg-muted/50 border border-border px-2 py-0.5 text-xs font-medium text-foreground shadow-sm"
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag.id);
              }}
              className="ml-0.5 text-muted-foreground hover:text-foreground"
              aria-label={`Remove ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? 'Search or create tags…' : ''}
          className="min-w-[120px] flex-1 bg-transparent py-0.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
        />
      </div>

      {/* Dropdown */}
      {open && items.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-card shadow-lg">
          {items.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                addTag(item);
              }}
              className={`cursor-pointer px-3 py-2 text-sm text-foreground ${i === activeIndex
                  ? 'bg-muted/30'
                  : ''
                }`}
            >
              {item.isNew ? (
                <span>
                  Create{' '}
                  <span className="font-semibold text-primary">
                    &quot;{item.name}&quot;
                  </span>
                </span>
              ) : (
                item.name
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Hidden inputs so FormData includes tag info */}
      {selected.map((tag) => (
        <input
          key={tag.id}
          type="hidden"
          name="tags"
          value={JSON.stringify({ id: tag.id, name: tag.name, isNew: !!tag.isNew })}
        />
      ))}
    </div>
  );
}

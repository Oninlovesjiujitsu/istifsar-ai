'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Conversation = {
  id: string;
  title: string | null;
  mode: string;
  updated_at: string;
};

export default function ConversationVault({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const [search, setSearch] = useState('');
  const pathname = usePathname();

  const filtered = search
    ? conversations.filter((c) =>
        (c.title ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  return (
    <>
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search inquiries..."
          className="w-full bg-[#0e0e0e] border-none text-xs py-2 pl-8 pr-2 rounded-sm focus:ring-1 focus:ring-gold/40 placeholder:text-text-muted-vault/30"
        />
        <svg
          className="absolute left-2 top-2 w-4 h-4 text-text-muted-vault/40"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 -mx-2 px-2 scrollbar-thin">
        {filtered.length === 0 && (
          <p className="text-[11px] text-text-muted-vault/40 py-2">
            {search ? 'No matching conversations' : 'No conversations yet'}
          </p>
        )}
        {filtered.map((c) => {
          const isActive = pathname === `/explore/${c.id}`;
          return (
            <Link
              key={c.id}
              href={`/explore/${c.id}`}
              className={`text-left text-xs p-2 rounded-sm transition-colors flex items-start gap-2 ${
                isActive
                  ? 'bg-gold/5 text-gold-bright border-l border-gold/40'
                  : 'text-text-muted-vault hover:text-foreground hover:bg-white/[0.04]'
              }`}
            >
              <svg
                className="w-3.5 h-3.5 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
                />
              </svg>
              <span className="line-clamp-2">
                {c.title ?? 'Untitled conversation'}
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

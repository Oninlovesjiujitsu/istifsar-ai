'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { deleteConversation, updateConversationTitle } from '@/actions/conversation';

type Conversation = {
  id: string;
  title: string | null;
  mode: string;
  updated_at: string;
};

// -------------------------------------------------------------------------
// ConversationItem Component
// -------------------------------------------------------------------------
function ConversationItem({
  c,
  isActive,
}: {
  c: Conversation;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(c.title ?? 'Untitled conversation');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  // Close menu if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleRename = () => {
    setTitleValue(c.title ?? 'Untitled conversation');
    setIsEditing(true);
    setIsMenuOpen(false);
  };

  const handleSaveRename = () => {
    setIsEditing(false);
    if (titleValue.trim() !== (c.title ?? 'Untitled conversation') && titleValue.trim() !== '') {
      startTransition(async () => {
        await updateConversationTitle(c.id, titleValue.trim());
      });
    } else {
      setTitleValue(c.title ?? 'Untitled conversation');
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (window.confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      startTransition(async () => {
        await deleteConversation(c.id);
        if (isActive) {
          router.push('/explore');
        }
      });
    }
  };

  return (
    <div
      className={`group relative flex items-center text-xs rounded-sm transition-colors ${isMenuOpen ? 'z-50' : 'z-10 hover:z-20'
        } ${isActive
          ? 'bg-gold/5 text-gold-bright border-l border-gold/40'
          : 'text-text-muted-vault hover:text-foreground hover:bg-white/[0.04]'
        }`}
    >
      <Link
        href={`/explore/${c.id}`}
        className="flex-1 flex items-start gap-2 p-2 min-w-0"
        onClick={(e) => {
          if (isEditing) e.preventDefault();
        }}
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

        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-black/60 text-foreground border border-gold/40 rounded-sm px-1.5 py-0.5 w-full outline-none group-hover:pr-8"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveRename();
              if (e.key === 'Escape') {
                setTitleValue(c.title ?? 'Untitled conversation');
                setIsEditing(false);
              }
            }}
            onClick={(e) => e.preventDefault()}
          />
        ) : (
          <span className={`line-clamp-2 pr-6 ${isPending ? 'opacity-50' : ''}`}>
            {c.title ?? 'Untitled conversation'}
          </span>
        )}
      </Link>

      {/* Options Menu Toggle */}
      {!isEditing && (
        <div
          className={`absolute right-1 top-1/2 -translate-y-1/2 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'
            }`}
          ref={menuRef}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 rounded-sm text-text-muted-vault hover:text-foreground hover:bg-white/10"
            title="Options"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-[#141414] border border-white/10 rounded-md shadow-lg overflow-hidden z-50 py-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleRename();
                }}
                className="w-full text-left px-3 py-2 text-xs text-text-muted-vault hover:bg-white/10 hover:text-foreground flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                Rename
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-white/10 flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------------------
// ConversationVault Component
// -------------------------------------------------------------------------
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

      <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 -mx-2 px-2 scrollbar-thin pb-4">
        {filtered.length === 0 && (
          <p className="text-[11px] text-text-muted-vault/40 py-2">
            {search ? 'No matching conversations' : 'No conversations yet'}
          </p>
        )}
        {filtered.map((c) => (
          <ConversationItem
            key={c.id}
            c={c}
            isActive={pathname === `/explore/${c.id}`}
          />
        ))}
      </div>
    </>
  );
}


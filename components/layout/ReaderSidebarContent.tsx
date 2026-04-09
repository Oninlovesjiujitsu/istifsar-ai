'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { QuillWrite01Icon } from '@hugeicons/core-free-icons';
import SignOutButton from '@/components/layout/SignOutButton';
import ConversationVault from '@/components/layout/ConversationVault';
import { SidebarToggle, SidebarLabel, useSidebar } from '@/components/layout/SidebarShell';

type Conversation = {
  id: string;
  title: string | null;
  mode: string;
  updated_at: string;
};

export default function ReaderSidebarContent({
  conversations,
}: {
  conversations: Conversation[];
}) {
  const { expanded, close } = useSidebar();

  return (
    <>
      <div className="px-4 flex items-center justify-between">
        <Link href="/explore" onClick={close} className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={QuillWrite01Icon} size={20} className="text-gold shrink-0" />
          <SidebarLabel>
            <span className="text-xl font-heading text-gold tracking-widest uppercase">
              Istifsar AI
            </span>
          </SidebarLabel>
        </Link>
        <SidebarToggle />
      </div>

      <div className="px-4">
        <Link
          href="/explore/new"
          onClick={close}
          className={[
            'flex items-center justify-center gap-2 bg-gold text-[#241a00] font-bold rounded-sm',
            'shadow-[0_4px_10px_rgba(212,175,55,0.2)] hover:bg-gold-bright transition-all text-sm uppercase tracking-tight',
            expanded ? 'w-full py-3' : 'lg:w-10 lg:h-10 lg:p-0 py-3 w-full',
          ].join(' ')}
          title="New Inquiry"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <SidebarLabel>New Inquiry</SidebarLabel>
        </Link>
      </div>

      <nav className="flex flex-col flex-grow overflow-hidden">
        <div className="flex flex-col gap-0.5 px-2">
          <SidebarNavLink href="/explore" icon="archive" onNavigate={close}>
            The Archive
          </SidebarNavLink>
          <SidebarNavLink href="/documents" icon="writings" onNavigate={close}>
            Writings
          </SidebarNavLink>
          <SidebarNavLink href="/bounty" icon="target" onNavigate={close}>
            Bounty Board
          </SidebarNavLink>
        </div>

        {/* Conversation Vault — hidden when collapsed on desktop */}
        {expanded && (
          <div className="mt-6 px-4 flex flex-col gap-3 flex-1 min-h-0">
            <span className="text-[10px] uppercase tracking-[0.2em] text-text-muted-vault">
              Conversation Vault
            </span>
            <ConversationVault conversations={conversations} />
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 flex flex-col gap-0.5 border-t border-white/[0.06] pt-4">
        <SidebarNavLink href="/settings" icon="settings" onNavigate={close}>
          Settings
        </SidebarNavLink>
        <div className={[
          'text-text-muted-vault hover:text-foreground px-3 py-2 transition-colors hover:bg-white/[0.04] flex items-center text-sm font-serif',
          expanded ? 'gap-3' : 'lg:justify-center gap-3',
        ].join(' ')}>
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <SidebarLabel>
            <SignOutButton />
          </SidebarLabel>
        </div>
      </div>
    </>
  );
}


const ICONS: Record<string, React.ReactNode> = {
  archive: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  writings: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  target: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
  ),
  settings: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  ),
};

function SidebarNavLink({
  href,
  icon,
  children,
  onNavigate,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  const { expanded } = useSidebar();

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={typeof children === 'string' ? children : undefined}
      className={[
        'text-text-muted-vault hover:text-foreground px-3 py-3 transition-colors hover:bg-white/[0.04] flex items-center font-serif text-sm tracking-tight',
        expanded ? 'gap-3' : 'lg:justify-center gap-3',
      ].join(' ')}
    >
      {ICONS[icon]}
      <SidebarLabel>{children}</SidebarLabel>
    </Link>
  );
}

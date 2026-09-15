'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import { QuillWrite01Icon } from '@hugeicons/core-free-icons';
import SignOutButton from '@/src/components/layout/SignOutButton';
import { SidebarToggle, SidebarLabel, useSidebar } from '@/src/components/layout/SidebarShell';
// import ThemePicker from '@/src/components/layout/ThemePicker';

export default function AdminSidebarContent() {
  const { expanded, close } = useSidebar();

  return (
    <>
      {/* Brand + Toggle */}
      <div className="px-4 flex items-center justify-between">
        <Link href="/admin" onClick={close} className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={QuillWrite01Icon} size={20} className="text-primary shrink-0" />
          <SidebarLabel>
            <span className="flex flex-col gap-0.5">
              <span className="text-xl font-heading text-foreground tracking-widest uppercase leading-none">
                Istifsar AI
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-destructive/80">
                Admin Console
              </span>
            </span>
          </SidebarLabel>
        </Link>
        <SidebarToggle />
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-col flex-grow overflow-hidden">
        <div className="flex flex-col gap-0.5 px-2">
          <SidebarNavLink href="/admin" icon="dashboard" onNavigate={close} exact>
            Dashboard
          </SidebarNavLink>
          <SidebarNavLink href="/admin/users" icon="users" onNavigate={close}>
            Users
          </SidebarNavLink>
          <SidebarNavLink href="/admin/verification" icon="verification" onNavigate={close}>
            Verification
          </SidebarNavLink>
          <SidebarNavLink href="/admin/contentions" icon="contentions" onNavigate={close}>
            Contentions
          </SidebarNavLink>
          <SidebarNavLink href="/admin/gaps" icon="gaps" onNavigate={close}>
            Archive Gaps
          </SidebarNavLink>
          <SidebarNavLink href="/admin/evaluations" icon="evaluations" onNavigate={close}>
            RAG Evaluation
          </SidebarNavLink>
        </div>

        {/* Switch views */}
        <div className="mt-auto px-2 pt-4">
          {expanded && (
            <span className="px-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
              Switch View
            </span>
          )}
          <Link
            href="/explore"
            onClick={close}
            title="Enter Archive"
            className={[
              'mt-1 text-muted-foreground hover:text-foreground px-3 py-3 transition-colors hover:bg-foreground/[0.04] flex items-center font-serif text-sm tracking-tight',
              expanded ? 'gap-3' : 'lg:justify-center gap-3',
            ].join(' ')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <SidebarLabel>Enter Archive</SidebarLabel>
          </Link>
          <Link
            href="/dashboard"
            onClick={close}
            title="Enter Workspace"
            className={[
              'text-text-muted-vault hover:text-foreground px-3 py-3 transition-colors hover:bg-foreground/[0.04] flex items-center font-serif text-sm tracking-tight',
              expanded ? 'gap-3' : 'lg:justify-center gap-3',
            ].join(' ')}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
            <SidebarLabel>Enter Workspace</SidebarLabel>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-2 flex flex-col gap-0.5 border-t border-border pt-4">
        {/* <ThemePicker showLabel /> */}
        <SignOutButton
          className={[
            'w-full text-text-muted-vault hover:text-foreground px-3 py-2 transition-colors hover:bg-foreground/[0.04] flex items-center text-sm font-serif rounded-sm',
            expanded ? 'gap-3 justify-start' : 'lg:justify-center gap-3',
          ].join(' ')}
        >
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <SidebarLabel>Sign Out</SidebarLabel>
        </SignOutButton>
      </div>
    </>
  );
}

/* ── Nav link icons ────────────────────────────────────────────────────── */

const ICONS: Record<string, React.ReactNode> = {
  dashboard: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
  verification: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  contentions: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  gaps: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.008v.008H12V18Z" />
    </svg>
  ),
  evaluations: (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  ),
};

function SidebarNavLink({
  href,
  icon,
  children,
  onNavigate,
  exact,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  exact?: boolean;
}) {
  const { expanded } = useSidebar();
  const pathname = usePathname();
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={typeof children === 'string' ? children : undefined}
      className={[
        'px-3 py-3 transition-colors flex items-center font-serif text-sm tracking-tight rounded-sm',
        isActive
          ? 'text-primary bg-accent'
          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]',
        expanded ? 'gap-3' : 'lg:justify-center gap-3',
      ].join(' ')}
    >
      {ICONS[icon]}
      <SidebarLabel>{children}</SidebarLabel>
    </Link>
  );
}

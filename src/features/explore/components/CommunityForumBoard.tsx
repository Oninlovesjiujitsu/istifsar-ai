'use client';

import React, { useState } from 'react';
import CreateRequestModal from './CreateRequestModal';
import RequestDetailModal, { RequestDetailItem } from './RequestDetailModal';
import { toggleUpvoteAction } from '../actions/gapActions';

export type ExtendedArchiveGap = {
  id: string;
  title: string | null;
  query_text: string;
  description: string | null;
  status: string;
  source_type: string;
  upvote_count: number;
  era: string | null;
  geography: string | null;
  subject: string | null;
  created_at: string;
  user_id: string | null;
  author?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    role?: string;
  } | null;
  hasUpvoted?: boolean;
};

type Props = {
  inquiries: ExtendedArchiveGap[];
  isAuthenticated: boolean;
};

export default function CommunityForumBoard({ inquiries, isAuthenticated }: Props) {
  const [items, setItems] = useState<ExtendedArchiveGap[]>(inquiries);
  const [filter, setFilter] = useState<'top' | 'recent' | 'open'>('top');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ExtendedArchiveGap | null>(null);

  // Sync state if props update from server
  React.useEffect(() => {
    setItems(inquiries);
  }, [inquiries]);

  const handleCardUpvote = async (e: React.MouseEvent, gapId: string) => {
    e.stopPropagation(); // Don't trigger card modal open
    if (!isAuthenticated) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === gapId) {
          const newUpvoted = !item.hasUpvoted;
          const newCount = newUpvoted
            ? item.upvote_count + 1
            : Math.max(0, item.upvote_count - 1);
          return { ...item, hasUpvoted: newUpvoted, upvote_count: newCount };
        }
        return item;
      })
    );

    const res = await toggleUpvoteAction(gapId);
    if (!res.success) {
      // Revert on failure
      setItems(inquiries);
    }
  };

  const handleModalUpvoteToggle = (gapId: string, newUpvoted: boolean) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === gapId) {
          const newCount = newUpvoted
            ? item.upvote_count + 1
            : Math.max(0, item.upvote_count - 1);
          return { ...item, hasUpvoted: newUpvoted, upvote_count: newCount };
        }
        return item;
      })
    );
  };

  // Filter & Sort Logic
  const sortedItems = [...items].sort((a, b) => {
    if (filter === 'top') {
      return b.upvote_count - a.upvote_count;
    }
    if (filter === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (filter === 'open') {
      if (a.status === 'open' && b.status !== 'open') return -1;
      if (a.status !== 'open' && b.status === 'open') return 1;
      return b.upvote_count - a.upvote_count;
    }
    return 0;
  });

  return (
    <section className="flex flex-col mt-12 sm:mt-16 relative">
      {/* Background decoration */}
      <div className="absolute inset-x-0 -top-8 -bottom-8 bg-muted/30 rounded-3xl -z-10 hidden sm:block"></div>
      
      {/* Section Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-heading text-foreground leading-tight flex items-center gap-2">
            <span>Community Forum</span>
            <span className="shrink-0 rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary uppercase tracking-wider align-middle">
              Inquiries & Requests
            </span>
          </h2>
          <p className="mt-2 text-muted-foreground max-w-2xl text-sm sm:text-base">
            Post and upvote historical research requests. Help historians know what primary sources or topics to research next.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-sm active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Post Request</span>
        </button>
      </header>

      {/* Sorting Tabs & Decorative Line */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-border/80">
        <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-xl">
          <button
            onClick={() => setFilter('top')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'top'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Top Voted
          </button>
          <button
            onClick={() => setFilter('recent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'recent'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === 'open'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Open Requests
          </button>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">
          Showing {sortedItems.length} inquiries
        </span>
      </div>

      {/* Cards Grid */}
      {sortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map((inquiry) => {
            const displayTitle = inquiry.title || inquiry.query_text;

            return (
              <div
                key={inquiry.id}
                onClick={() => setSelectedRequest(inquiry)}
                className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/40 hover:-translate-y-1 cursor-pointer"
              >
                <div>
                  {/* Status & Author info */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                      inquiry.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : inquiry.status === 'investigating'
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {inquiry.status}
                    </span>

                    {inquiry.author && (
                      <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                        by {inquiry.author.display_name}
                      </span>
                    )}
                  </div>

                  {/* Title / Question */}
                  <p className="text-base font-serif font-medium leading-relaxed text-foreground mb-4 line-clamp-3">
                    &ldquo;{displayTitle}&rdquo;
                  </p>

                  {/* AI Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {inquiry.era && (
                      <span className="inline-block rounded-md bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary border border-primary/10">
                        {inquiry.era}
                      </span>
                    )}
                    {inquiry.geography && (
                      <span className="inline-block rounded-md bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary border border-primary/10">
                        {inquiry.geography}
                      </span>
                    )}
                    {inquiry.subject && (
                      <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {inquiry.subject}
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  {/* Upvote Button */}
                  <button
                    onClick={(e) => handleCardUpvote(e, inquiry.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      inquiry.hasUpvoted
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                    <span>{inquiry.upvote_count}</span>
                  </button>

                  <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                    <span>Discuss & Lead</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-serif text-foreground mb-2">No Inquiries Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Be the first to post a research request to historians and archivists!
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all"
          >
            <span>Post Archival Request</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateRequestModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => window.location.reload()}
        isAuthenticated={isAuthenticated}
      />

      <RequestDetailModal
        request={selectedRequest}
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        isAuthenticated={isAuthenticated}
        onUpvoteToggle={handleModalUpvoteToggle}
      />
    </section>
  );
}

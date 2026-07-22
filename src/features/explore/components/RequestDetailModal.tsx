'use client';

import React, { useState, useEffect } from 'react';
import { addCommentAction, fetchCommentsAction, toggleUpvoteAction } from '../actions/gapActions';

export type RequestDetailItem = {
  id: string;
  title: string | null;
  query_text: string;
  description: string | null;
  status: string;
  era: string | null;
  geography: string | null;
  subject: string | null;
  upvote_count: number;
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

type CommentItem = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    display_name: string;
    avatar_url: string | null;
    role?: string;
  } | null;
};

type Props = {
  request: RequestDetailItem | null;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  onUpvoteToggle?: (gapId: string, newUpvoted: boolean) => void;
};

export default function RequestDetailModal({
  request,
  isOpen,
  onClose,
  isAuthenticated,
  onUpvoteToggle,
}: Props) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    if (request && isOpen) {
      setUpvoted(!!request.hasUpvoted);
      setUpvoteCount(request.upvote_count || 0);
      loadComments(request.id);
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const loadComments = async (gapId: string) => {
    setLoadingComments(true);
    const res = await fetchCommentsAction(gapId);
    if (res.success) {
      setComments(res.comments as CommentItem[]);
    }
    setLoadingComments(false);
  };

  const handleUpvote = async () => {
    if (!isAuthenticated) return;
    const prevUpvoted = upvoted;
    const prevCount = upvoteCount;

    // Optimistic UI
    setUpvoted(!prevUpvoted);
    setUpvoteCount(prevUpvoted ? Math.max(0, prevCount - 1) : prevCount + 1);

    const res = await toggleUpvoteAction(request.id);
    if (!res.success) {
      // Revert if error
      setUpvoted(prevUpvoted);
      setUpvoteCount(prevCount);
    } else {
      onUpvoteToggle?.(request.id, res.upvoted ?? !prevUpvoted);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setCommentError('You must be signed in to post a comment.');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    setCommentError(null);

    const res = await addCommentAction(request.id, newComment);
    if (res.success && res.comment) {
      setNewComment('');
      loadComments(request.id);
    } else {
      setCommentError(res.error || 'Failed to post comment.');
    }
    setSubmittingComment(false);
  };

  const displayTitle = request.title || request.query_text;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border bg-muted/20">
          <div className="space-y-2 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                request.status === 'resolved' 
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
                  : request.status === 'investigating'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-primary/10 text-primary border border-primary/20'
              }`}>
                {request.status}
              </span>
              {request.era && (
                <span className="rounded-md bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary border border-primary/10">
                  {request.era}
                </span>
              )}
              {request.geography && (
                <span className="rounded-md bg-primary/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-primary border border-primary/10">
                  {request.geography}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-medium text-foreground leading-snug">
              &ldquo;{displayTitle}&rdquo;
            </h2>
            {request.author && (
              <p className="text-xs text-muted-foreground">
                Posted by <span className="font-medium text-foreground">{request.author.display_name}</span> (@{request.author.username})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Description */}
          {request.description && (
            <div className="prose prose-sm text-muted-foreground leading-relaxed bg-muted/10 p-4 rounded-xl border border-border/50">
              <p className="whitespace-pre-wrap">{request.description}</p>
            </div>
          )}

          {/* Upvote Row */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
            <span className="text-xs text-muted-foreground">
              Signal interest to historians and archivists:
            </span>
            <button
              onClick={handleUpvote}
              disabled={!isAuthenticated}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                upvoted
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <svg className={`w-4 h-4 transition-transform ${upvoted ? 'scale-110' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
              <span>{upvoted ? 'Upvoted' : 'Upvote'} ({upvoteCount})</span>
            </button>
          </div>

          {/* Commentary / Leads Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-heading text-foreground flex items-center gap-2">
              <span>Community Commentary & Leads</span>
              <span className="text-xs font-normal text-muted-foreground">({comments.length})</span>
            </h3>

            {loadingComments ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Loading discussion...</span>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-border/80 bg-card/60 text-xs space-y-2">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">
                          {c.profiles?.display_name || 'Community Contributor'}
                        </span>
                        {c.profiles?.role === 'historian' && (
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-amber-600 border border-amber-500/20">
                            Verified Historian
                          </span>
                        )}
                      </div>
                      <span className="text-[10px]">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                No commentary yet. Be the first to share a lead or perspective!
              </div>
            )}
          </div>
        </div>

        {/* Comment Form Footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          {commentError && (
            <p className="text-xs text-destructive mb-2">{commentError}</p>
          )}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={isAuthenticated ? "Add commentary, lead, or source suggestion..." : "Sign in to leave a comment"}
              disabled={!isAuthenticated || submittingComment}
              className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!isAuthenticated || submittingComment || !newComment.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0"
            >
              {submittingComment ? 'Sending...' : 'Reply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { createAdminClient } from '@/src/lib/supabase/admin';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, ThumbsUp } from 'lucide-react';

export const metadata: Metadata = { title: 'Archive Gaps — Admin — Istifsar' };

export default async function AdminArchiveGapsPage() {
  const db = createAdminClient();

  const { data: gaps, error } = await db
    .from('archive_gaps')
    .select('*, profiles!archive_gaps_user_id_fkey(display_name, username)')
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching archive gaps:', error);
  }

  return (
    <div className="space-y-8 sm:space-y-10 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-dim font-serif mb-1">
          <Link href="/admin" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5 inline" /> Admin Console
          </Link>
          <span>/</span>
          <span>Archive Gaps</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
          Archive Gaps Board
        </h1>
        <p className="mt-1 text-base text-muted-foreground font-serif italic">
          Unanswered historical queries logged by the system. Guides what sources to acquire & index next.
        </p>
      </div>

      {/* Gaps List */}
      <div className="space-y-4">
        {(!gaps || gaps.length === 0) ? (
          <div className="rounded-md border border-border/80 bg-card parchment-texture p-12 text-center shadow-sm">
            <HelpCircle className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-semibold text-foreground">No Logged Gaps</h3>
            <p className="text-sm font-serif text-muted-foreground mt-1">
              All user inquiries have been satisfied by verified archival sources.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {gaps.map((gap) => {
              const profile = gap.profiles as { display_name?: string; username?: string } | null;
              return (
                <div
                  key={gap.id}
                  className="rounded-md border border-border/80 bg-card parchment-texture p-5 shadow-sm space-y-3 hover:border-gold/50 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-heading font-semibold text-foreground leading-snug">
                        {gap.title || gap.query_text}
                      </h3>
                      <span className="inline-flex items-center gap-1 shrink-0 rounded-sm border border-gold/40 bg-gold/10 px-2 py-0.5 text-xs font-serif font-medium text-gold-dim">
                        <ThumbsUp className="h-3 w-3" /> {gap.upvote_count || 0}
                      </span>
                    </div>

                    {gap.description && (
                      <p className="text-sm font-serif text-muted-foreground line-clamp-3 leading-relaxed">
                        {gap.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs font-serif text-muted-foreground">
                    <span>
                      {profile?.display_name ? `By ${profile.display_name}` : 'Logged by System'}
                    </span>
                    <span>
                      {new Date(gap.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

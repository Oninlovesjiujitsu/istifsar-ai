import { createAdminClient } from '@/src/lib/supabase/admin';
import { createClient } from '@/src/lib/supabase/server';
import ContentionExplorer from '@/src/features/explore/components/ContentionExplorer';
import CommunityForumBoard, { ExtendedArchiveGap } from '@/src/features/explore/components/CommunityForumBoard';
import type { Metadata } from 'next';
import type { ContentionMeta } from '@/src/types/contention';

export const metadata: Metadata = {
  title: 'Explore — Istifsar Archive',
};

export default async function ExplorePage() {
  const adminSupabase = createAdminClient();
  const serverSupabase = await createClient();

  const { data: { user } } = await serverSupabase.auth.getUser();

  // 1. Fetch latest open contentions
  const { data: rawContentions } = await adminSupabase
    .from('contentions')
    .select('id, title, description, topic, claims, status, document_ids, updated_at')
    .eq('status', 'open')
    .order('updated_at', { ascending: false })
    .limit(3);

  let resolvedContentions: ContentionMeta[] = [];

  if (rawContentions && rawContentions.length > 0) {
    const contentionDocIds = [...new Set(rawContentions.flatMap((c) => c.document_ids))];
    const { data: contentionDocs } = await adminSupabase
      .from('documents')
      .select('id, title, author_name, profiles!documents_submitter_id_fkey(username, display_name)')
      .in('id', contentionDocIds);

    const docTitleMap = new Map<string, string>();
    const docAuthorMap = new Map<string, { username: string; display_name: string }>();
    if (contentionDocs) {
      for (const doc of contentionDocs) {
        docTitleMap.set(doc.id, doc.title);
        const profile = doc.profiles as unknown as { username: string; display_name: string } | null;
        if (doc.author_name || profile) {
          docAuthorMap.set(doc.id, {
            username: profile?.username ?? '',
            display_name: doc.author_name ?? profile?.display_name ?? 'Unknown Scholar',
          });
        }
      }
    }

    resolvedContentions = rawContentions.map((c) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawClaims: any[] = Array.isArray(c.claims) ? (c.claims as any[]) : [];
      const claims = rawClaims
        .filter((cl) => typeof cl?.document_id === 'string' && typeof cl?.claim === 'string')
        .map((cl) => {
          const author = docAuthorMap.get(cl.document_id);
          const finalHistorianName = cl.historian_name ?? author?.display_name ?? 'Unknown Scholar';
          return {
            documentId: cl.document_id as string,
            documentTitle: docTitleMap.get(cl.document_id) ?? 'Unknown Document',
            scholarName: finalHistorianName,
            scholarUsername: author?.username ?? '',
            historianName: cl.historian_name ?? null,
            argumentHeadline: cl.argument_headline ?? cl.claim,
            claim: cl.claim as string,
            excerpt: typeof cl.excerpt === 'string' ? cl.excerpt : null,
          };
        });

      return {
        contentionId: c.id,
        title: c.title,
        description: c.description,
        topic: c.topic,
        claims,
        status: c.status as 'open' | 'resolved' | 'disputed',
        documentIds: c.document_ids,
        documentTitles: c.document_ids.map((id: string) => docTitleMap.get(id) ?? 'Unknown Document'),
        scholarNames: c.document_ids.map((id: string) => docAuthorMap.get(id)?.display_name ?? 'Unknown Scholar'),
        scholarUsernames: c.document_ids.map((id: string) => docAuthorMap.get(id)?.username ?? ''),
      };
    });
  }

  // 2. Fetch community inquiries (archive gaps) with author profiles & upvote counts
  const { data: rawInquiries } = await adminSupabase
    .from('archive_gaps')
    .select(`
      id,
      title,
      query_text,
      description,
      status,
      source_type,
      upvote_count,
      era,
      geography,
      subject,
      created_at,
      user_id,
      profiles!archive_gaps_user_id_fkey(username, display_name, avatar_url, role)
    `)
    .order('upvote_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(18);

  // Fetch current user upvotes if authenticated
  let userUpvotedGapIds = new Set<string>();
  if (user) {
    const { data: upvotes } = await adminSupabase
      .from('archive_gap_upvotes')
      .select('gap_id')
      .eq('user_id', user.id);

    if (upvotes) {
      userUpvotedGapIds = new Set(upvotes.map((u) => u.gap_id));
    }
  }

  const extendedInquiries: ExtendedArchiveGap[] = (rawInquiries || []).map((item) => {
    const profile = item.profiles as unknown as {
      username: string;
      display_name: string;
      avatar_url: string | null;
      role?: string;
    } | null;

    return {
      id: item.id,
      title: item.title,
      query_text: item.query_text,
      description: item.description,
      status: item.status || 'open',
      source_type: item.source_type || 'user_post',
      upvote_count: item.upvote_count || 0,
      era: item.era,
      geography: item.geography,
      subject: item.subject,
      created_at: item.created_at,
      user_id: item.user_id,
      author: profile
        ? {
            username: profile.username,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            role: profile.role,
          }
        : null,
      hasUpvoted: userUpvotedGapIds.has(item.id),
    };
  });

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 xl:p-12 relative max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground flex items-center gap-2">
        <span className="text-primary font-medium">Archive</span>
        <span>/</span>
        <span className="text-foreground">Explore</span>
      </nav>

      {/* Page Header */}
      <header className="mb-12 sm:mb-16">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Discovery Hub
        </span>
        <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-heading text-foreground leading-tight max-w-3xl">
          The Frontier of History
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
          Explore active debates shaping our understanding of the past, signal demand for research, and engage with community-posted historical inquiries.
        </p>
        <div className="h-px w-32 bg-gradient-to-r from-border to-transparent mt-8" />
      </header>

      {/* Main Content Sections */}
      <ContentionExplorer contentions={resolvedContentions} />
      
      <CommunityForumBoard
        inquiries={extendedInquiries}
        isAuthenticated={!!user}
      />
    </div>
  );
}

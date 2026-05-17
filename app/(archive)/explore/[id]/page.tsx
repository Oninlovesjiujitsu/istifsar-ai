import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import ChatInterface from '@/components/chat/ChatInterface';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { ContentionMeta } from '@/types/contention';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ topic?: string; doc?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from('conversations')
    .select('title')
    .eq('id', id)
    .single();
  return {
    title: conv?.title ? `${conv.title} — Istifsar` : 'Conversation — Istifsar',
  };
}

export default async function ConversationPage({ params, searchParams }: Props) {
  await proxy({ requireAuth: true });

  const { id } = await params;
  const { topic: topicParam, doc: docParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title, mode, scope_document_id, scope_topic_id')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (!conv) redirect('/explore');

  const effectiveDocId = conv.scope_document_id ?? docParam ?? null;
  const effectiveTopicId = conv.scope_topic_id ?? topicParam ?? null;

  const [{ data: messagesRaw }, { data: tags }] = await Promise.all([
    supabase
      .from('messages')
      .select(
        'id, role, content, topic_id, citations(position, excerpt, similarity_score, document_id, documents(title, date_of_origin, profiles!documents_submitter_id_fkey(username, display_name)))'
      )
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('tags')
      .select('id, name')
      .order('name'),
  ]);

  let docTitle: string | null = null;
  if (effectiveDocId) {
    const { data: doc } = await supabase
      .from('documents')
      .select('title')
      .eq('id', effectiveDocId)
      .single();
    docTitle = doc?.title ?? null;
  }

  const topics = (tags ?? []).map((t) => ({ id: t.id, name: t.name }));

  // ── Load contentions for cited documents so they survive page refresh ──
  const allDocIds = [
    ...new Set(
      (messagesRaw ?? []).flatMap((m) =>
        ((m.citations as any[]) ?? []).map((c: any) => c.document_id).filter(Boolean),
      ),
    ),
  ];

  let contentionsByMessage = new Map<string, ContentionMeta[]>();

  if (allDocIds.length > 0) {
    const { data: rawContentions } = await supabase
      .from('contentions')
      .select('id, title, description, topic, claims, status, document_ids, created_at')
      .overlaps('document_ids', allDocIds)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(5);

    if (rawContentions && rawContentions.length > 0) {
      // Fetch titles + author profiles for contention documents
      const contentionDocIds = [...new Set(rawContentions.flatMap((c) => c.document_ids))];
      const { data: contentionDocs } = await supabase
        .from('documents')
        .select('id, title, profiles!documents_submitter_id_fkey(username, display_name)')
        .in('id', contentionDocIds);

      const docTitleMap = new Map<string, string>();
      const docAuthorMap = new Map<string, { username: string; display_name: string }>();
      if (contentionDocs) {
        for (const doc of contentionDocs) {
          docTitleMap.set(doc.id, doc.title);
          const profile = doc.profiles as unknown as { username: string; display_name: string } | null;
          if (profile) docAuthorMap.set(doc.id, profile);
        }
      }

      // Deduplicate by contention ID
      const seenIds = new Set<string>();
      const resolvedContentions: ContentionMeta[] = [];
      for (const c of rawContentions) {
        if (seenIds.has(c.id)) continue;
        seenIds.add(c.id);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawClaims: any[] = Array.isArray(c.claims) ? (c.claims as any[]) : [];
        const claims = rawClaims
          .filter(
            (cl) => typeof cl?.document_id === 'string' && typeof cl?.claim === 'string',
          )
          .map((cl) => ({
            documentId: cl.document_id as string,
            documentTitle: docTitleMap.get(cl.document_id) ?? 'Unknown Document',
            scholarName: docAuthorMap.get(cl.document_id)?.display_name ?? 'Unknown Scholar',
            scholarUsername: docAuthorMap.get(cl.document_id)?.username ?? '',
            claim: cl.claim as string,
            excerpt: typeof cl.excerpt === 'string' ? cl.excerpt : null,
          }));

        resolvedContentions.push({
          contentionId: c.id,
          title: c.title,
          description: c.description,
          topic: c.topic,
          claims,
          status: c.status as 'open' | 'resolved' | 'disputed',
          documentIds: c.document_ids,
          documentTitles: c.document_ids.map(
            (id: string) => docTitleMap.get(id) ?? 'Unknown Document',
          ),
          scholarNames: c.document_ids.map(
            (id: string) => docAuthorMap.get(id)?.display_name ?? 'Unknown Scholar',
          ),
          scholarUsernames: c.document_ids.map(
            (id: string) => docAuthorMap.get(id)?.username ?? '',
          ),
        });
      }

      // For each assistant message, find contentions that overlap with its cited doc IDs
      for (const m of messagesRaw ?? []) {
        if (m.role !== 'assistant') continue;
        const msgDocIds = new Set(
          ((m.citations as any[]) ?? []).map((c: any) => c.document_id).filter(Boolean),
        );
        if (msgDocIds.size === 0) continue;
        const matching = resolvedContentions.filter((ct) =>
          ct.documentIds.some((id) => msgDocIds.has(id)),
        );
        if (matching.length > 0) {
          contentionsByMessage.set(m.id, matching);
        }
      }
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatInterface
        conversationId={id}
        initialMessages={(messagesRaw ?? []).map((m) => {
          let metadata = undefined;

          const msgContentions = contentionsByMessage.get(m.id);

          if (m.citations && (m.citations as any[]).length > 0) {
            const sortedCitations = [...(m.citations as any[])].sort((a, b) => (a.position || 0) - (b.position || 0));
            metadata = {
              citations: sortedCitations.map((c) => {
                const doc = c.documents as any;
                const profile = doc?.profiles as any;
                return {
                  position: c.position,
                  documentId: c.document_id,
                  documentTitle: doc?.title ?? 'Unknown Document',
                  documentDate: doc?.date_of_origin ?? null,
                  excerpt: c.excerpt ?? '',
                  score: c.similarity_score ?? 0,
                  authorUsername: profile?.username ?? null,
                  authorDisplayName: profile?.display_name ?? null,
                };
              }),
              ...(msgContentions ? { contentions: msgContentions } : {}),
            };
          } else if (msgContentions) {
            metadata = { contentions: msgContentions };
          }

          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            metadata,
            topicId: m.topic_id ?? null,
          };
        })}
        topics={effectiveDocId ? undefined : topics}
        initialTopicId={effectiveTopicId}
        documentId={effectiveDocId}
        documentTitle={docTitle}
      />
    </div>
  );
}

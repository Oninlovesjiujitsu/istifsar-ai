import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import ChatInterface from '@/components/chat/ChatInterface';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

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
    .select('id, title, mode, active_lens_id, scope_document_id, scope_topic_id')
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
        'id, role, content, citations(position, excerpt, similarity_score, document_id, documents(title, date_of_origin))'
      )
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('tags')
      .select('id, name')
      .order('name'),
  ]);

  let lensTitle: string | null = null;
  if (conv.active_lens_id) {
    const { data: lens } = await supabase
      .from('living_essays')
      .select('title')
      .eq('id', conv.active_lens_id)
      .single();
    lensTitle = lens?.title ?? null;
  }

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

  return (
    <div className="flex h-screen min-h-0 flex-col">
      <ChatInterface
        conversationId={id}
        initialMessages={(messagesRaw ?? []).map((m) => {
          let metadata = undefined;

          if (m.citations && (m.citations as any[]).length > 0) {
            const sortedCitations = [...(m.citations as any[])].sort((a, b) => (a.position || 0) - (b.position || 0));
            metadata = {
              citations: sortedCitations.map((c) => ({
                position: c.position,
                documentId: c.document_id,
                documentTitle: (c.documents as any)?.title ?? 'Unknown Document',
                documentDate: (c.documents as any)?.date_of_origin ?? null,
                excerpt: c.excerpt ?? '',
                score: c.similarity_score ?? 0,
              })),
            };
          }

          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            metadata,
          };
        })}
        initialMode={conv.mode as 'raw_evidence' | 'interpreted'}
        lensTitle={lensTitle}
        topics={effectiveDocId ? undefined : topics}
        initialTopicId={effectiveTopicId}
        documentId={effectiveDocId}
        documentTitle={docTitle}
      />
    </div>
  );
}

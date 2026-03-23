import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import ChatInterface from '@/components/chat/ChatInterface';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

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

export default async function ConversationPage({ params }: Props) {
  await proxy({ requireAuth: true });

  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title, mode, active_lens_id')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single();

  if (!conv) redirect('/explore');

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  // Resolve Lens essay title for interpreted mode conversations
  let lensTitle: string | null = null;
  if (conv.active_lens_id) {
    const { data: lens } = await supabase
      .from('living_essays')
      .select('title')
      .eq('id', conv.active_lens_id)
      .single();
    lensTitle = lens?.title ?? null;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <ChatInterface
        conversationId={id}
        initialMessages={(messages ?? []).map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }))}
        initialMode={conv.mode as 'raw_evidence' | 'interpreted'}
        lensTitle={lensTitle}
      />
    </div>
  );
}

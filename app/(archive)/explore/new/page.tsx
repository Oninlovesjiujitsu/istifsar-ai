import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import ChatInterface from '@/app/components/chat/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'New Inquiry — Istifsar AI' };

export default async function NewConversationPage() {
  await proxy({ requireAuth: true });

  const supabase = await createClient();
  const { data: tags } = await supabase
    .from('tags')
    .select('id, name')
    .order('name');

  const topics = (tags ?? []).map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatInterface
        conversationId={null}
        initialMessages={[]}
        topics={topics}
      />
    </div>
  );
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ConversationRow = {
  id: string;
  title: string | null;
  mode: string;
  scope_document_id: string | null;
  scope_topic_id: string | null;
  created_at: string;
  updated_at: string;
};
export async function createConversation(
  scopeDocumentId?: string,
  scopeTopicId?: string,
): Promise<{ success: true; conversationId: string } | { success: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated.' };
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      mode: 'scholarly_consensus',
      scope_document_id: scopeDocumentId ?? null,
      scope_topic_id: scopeTopicId ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create conversation.' };
  }

  revalidatePath('/explore');

  return { success: true, conversationId: data.id };
}

export async function getConversations(): Promise<ConversationRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('conversations')
    .select('id, title, mode, scope_document_id, scope_topic_id, created_at, updated_at')
    .order('updated_at', { ascending: false });

  return (data ?? []) as ConversationRow[];
}

export async function getConversationWithMessages(conversationId: string): Promise<{
  conversation: ConversationRow;
  messages: Array<{ id: string; role: string; content: string; created_at: string }>;
} | null> {
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title, mode, scope_document_id, scope_topic_id, created_at, updated_at')
    .eq('id', conversationId)
    .single();

  if (!conv) return null;

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  return {
    conversation: conv as ConversationRow,
    messages: (messages ?? []) as Array<{
      id: string;
      role: string;
      content: string;
      created_at: string;
    }>,
  };
}

export async function updateConversationTitle(
  conversationId: string,
  title: string,
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('conversations')
    .update({ title })
    .eq('id', conversationId);

  revalidatePath('/explore');
  revalidatePath(`/explore/${conversationId}`);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  revalidatePath('/explore');
}

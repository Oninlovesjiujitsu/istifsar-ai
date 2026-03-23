'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export type ConversationRow = {
  id: string;
  title: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
};

// ---------------------------------------------------------------------------
// createConversation
// ---------------------------------------------------------------------------

/**
 * Create a new conversation for the current user.
 * Defaults to raw_evidence mode. Pass a lensId to set an active Lens essay
 * for interpreted mode.
 */
export async function createConversation(
  mode: 'raw_evidence' | 'interpreted' = 'raw_evidence',
  lensId?: string,
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
      mode,
      active_lens_id: lensId ?? null,
    })
    .select('id')
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Failed to create conversation.' };
  }

  revalidatePath('/explore');

  return { success: true, conversationId: data.id };
}

// ---------------------------------------------------------------------------
// getConversations
// ---------------------------------------------------------------------------

/** Return the current user's conversations, most recently updated first. */
export async function getConversations(): Promise<ConversationRow[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('conversations')
    .select('id, title, mode, created_at, updated_at')
    .order('updated_at', { ascending: false });

  return (data ?? []) as ConversationRow[];
}

// ---------------------------------------------------------------------------
// getConversationWithMessages
// ---------------------------------------------------------------------------

/** Load a single conversation plus its messages. Returns null if not found. */
export async function getConversationWithMessages(conversationId: string): Promise<{
  conversation: ConversationRow;
  messages: Array<{ id: string; role: string; content: string; created_at: string }>;
} | null> {
  const supabase = await createClient();

  const { data: conv } = await supabase
    .from('conversations')
    .select('id, title, mode, created_at, updated_at')
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

// ---------------------------------------------------------------------------
// updateConversationTitle
// ---------------------------------------------------------------------------

/** Set a human-readable title on a conversation (e.g. inferred from first message). */
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

// ---------------------------------------------------------------------------
// deleteConversation
// ---------------------------------------------------------------------------

/** Permanently delete a conversation and all its messages/citations. */
export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId);

  revalidatePath('/explore');
}

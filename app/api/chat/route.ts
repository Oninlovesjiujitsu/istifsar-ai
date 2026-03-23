import { convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { runRag } from '@/lib/ai/rag';

export async function POST(req: Request): Promise<Response> {
  // ── Auth check ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ── Parse request body ─────────────────────────────────────────────────
  const { messages, conversationId, lensTitle } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
    lensTitle?: string | null;
  };

  // ── Validate conversation ownership ────────────────────────────────────
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, mode')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single();

  if (!conv) {
    return new Response('Conversation not found', { status: 404 });
  }

  // ── Extract the last user message ──────────────────────────────────────
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');

  if (!lastUserMessage) {
    return new Response('No user message', { status: 400 });
  }

  // Extract text content from the UIMessage parts
  const lastUserText = lastUserMessage.parts
    .filter((p): p is { type: 'text'; text: string } & typeof p => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('');

  if (!lastUserText.trim()) {
    return new Response('No user message text', { status: 400 });
  }

  // ── Persist the user message ───────────────────────────────────────────
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: lastUserText,
  });

  // ── Build history for the LLM ──────────────────────────────────────────
  // Convert the prior messages (all but the last user turn) to model message format.
  // runRag appends the current query as the final user turn.
  const priorMessages = messages.slice(0, -1);
  const modelMessages = await convertToModelMessages(priorMessages);
  const history = modelMessages
    .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
      (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    .map((m) => ({ role: m.role, content: m.content }));

  // ── Run the RAG pipeline ───────────────────────────────────────────────
  return runRag({
    query: lastUserText,
    conversationId,
    history,
    mode: conv.mode as 'raw_evidence' | 'interpreted',
    lensTitle: lensTitle ?? null,
    userId: user.id,
  });
}

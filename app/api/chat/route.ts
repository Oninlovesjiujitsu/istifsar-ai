import { convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { runRag } from '@/lib/ai/rag';
import { checkRateLimit } from '@/lib/cache/rate-limit';

export async function POST(req: Request): Promise<Response> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const rl = await checkRateLimit(user.id);
  if (!rl.success) {
    return new Response('Too many requests. Please wait a moment.', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(rl.limit),
        'X-RateLimit-Remaining': String(rl.remaining),
        'X-RateLimit-Reset': String(rl.reset),
      },
    });
  }

  // Parse request body 
  const { messages, conversationId, lensTitle, topicTagId, documentId, documentTitle, targetScholar, semanticQuery } = (await req.json()) as {
    messages: UIMessage[];
    conversationId: string;
    lensTitle?: string | null;
    topicTagId?: string | null;
    documentId?: string | null;
    documentTitle?: string | null;
    targetScholar?: string | null;
    semanticQuery?: string | null;
  };

  // Validate conversation ownership 
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, mode, active_lens_id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single();

  if (!conv) {
    return new Response('Conversation not found', { status: 404 });
  }

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

  // Persist the user message with topic context
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: lastUserText,
    topic_id: topicTagId ?? null,
  });

  // Update conversation's scope_topic_id to reflect the latest topic used
  if (topicTagId) {
    await supabase
      .from('conversations')
      .update({ scope_topic_id: topicTagId })
      .eq('id', conversationId);
  }

  // Build history for the LLM 
  // Convert the prior messages (all but the last user turn) to model message format.
  // runRag appends the current query as the final user turn.
  const priorMessages = messages.slice(0, -1);
  const modelMessages = await convertToModelMessages(priorMessages);
  const history = modelMessages
    .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
      (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    .map((m) => ({ role: m.role, content: m.content }));

  //  Run the RAG pipeline 
  try {
    return await runRag({
      query: semanticQuery?.trim() || lastUserText,
      conversationId,
      history,
      mode: conv.mode as 'scholarly_consensus' | 'scholar_lens',
      lensTitle: lensTitle ?? null,
      lensEssayId: conv.active_lens_id ?? null,
      topicTagId: topicTagId ?? null,
      documentId: documentId ?? null,
      documentTitle: documentTitle ?? null,
      targetScholar: targetScholar ?? null,
      userId: user.id,
      accessToken: session.access_token,
    });
  } catch (err) {
    console.error('[chat route error]', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return new Response(message, { status: 500 });
  }
}

import { Client } from "@upstash/qstash";

const qstashClient = new Client({
  token: process.env.QSTASH_TOKEN || "",
});

export interface TracePayload {
  query: string;
  retrieved_context: string[];
  generated_answer: string;
  historian_notes?: string;
  timestamp: string;
  record_id: string; // Supabase message UUID
}

/**
 * Fires the evaluation payload to Upstash QStash.
 * QStash acts as a broker and reliably forwards this to our FastAPI Eval Hub.
 */
export async function publishEvaluationTrace(payload: TracePayload) {
  const webhookUrl = process.env.EVAL_HUB_WEBHOOK_URL;
  
  if (!webhookUrl) {
    throw new Error("EVAL_HUB_WEBHOOK_URL is not defined in environment variables.");
  }

  try {
    const result = await qstashClient.publishJSON({
      url: webhookUrl,
      body: payload,
      headers: {
        "Upstash-Forward-Bypass-Tunnel-Reminder": "true",
      },
    });
    console.log("Successfully published trace to QStash:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Failed to publish trace to QStash:", error);
    return { success: false, error };
  }
}

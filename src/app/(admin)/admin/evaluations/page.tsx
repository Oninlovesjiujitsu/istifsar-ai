import { createAdminClient } from "@/src/lib/supabase/admin";
import { EvaluationRow } from "./EvaluationRow";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "RAG Evaluations — Admin — Istifsar" };

export default async function EvaluationsPage() {
  const db = createAdminClient();

  // Fetch all flagged messages
  const { data: flaggedMessages, error } = await db
    .from("messages")
    .select("*")
    .eq("is_hallucination_flagged", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching evaluations:", error);
  }

  // Fetch the preceding user query for each flagged AI message
  const messagesWithQueries = await Promise.all(
    (flaggedMessages || []).map(async (msg) => {
      const { data: userMsgs } = await db
        .from("messages")
        .select("*")
        .eq("conversation_id", msg.conversation_id)
        .eq("role", "user")
        .lt("created_at", msg.created_at)
        .order("created_at", { ascending: false })
        .limit(1);

      return {
        ...msg,
        userQuery: userMsgs?.[0]?.content || "Unknown Query",
      };
    })
  );

  return (
    <div className="space-y-8 sm:space-y-10 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-dim font-serif mb-1">
          <Link href="/admin" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5 inline" /> Admin Console
          </Link>
          <span>/</span>
          <span>RAG Evaluation Hub</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
          RAG System Evaluations
        </h1>
        <p className="mt-1 text-base text-muted-foreground font-serif italic">
          Audit flagged responses for potential hallucinations and verify automated evaluation scores.
        </p>
      </div>

      <div className="rounded-md border border-border/80 bg-card parchment-texture overflow-hidden shadow-sm">
        <div className="overflow-x-auto vault-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/40 text-muted-foreground uppercase tracking-wider text-xs font-serif font-semibold">
              <tr>
                <th scope="col" className="px-5 py-4">Date</th>
                <th scope="col" className="px-5 py-4 w-1/4">User Query</th>
                <th scope="col" className="px-5 py-4 w-1/3">AI Answer</th>
                <th scope="col" className="px-5 py-4">Faithfulness</th>
                <th scope="col" className="px-5 py-4">Relevancy</th>
                <th scope="col" className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-serif">
              {messagesWithQueries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground font-serif">
                    No flagged evaluations found. The archive is safe.
                  </td>
                </tr>
              ) : (
                messagesWithQueries.map((record) => (
                  <EvaluationRow key={record.id} record={record as any} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


import { createAdminClient } from "@/src/lib/supabase/admin";
import { EvaluationRow } from "./EvaluationRow";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "RAG Evaluations — Admin" };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
            <ArrowLeft className="h-4 w-4" />
            <Link href="/admin">Back to Dashboard</Link>
          </div>
          <h1 className="text-3xl font-bold font-heading">RAG Evaluations</h1>
          <p className="mt-1 text-muted-foreground">
            Review automatically graded responses flagged for potential hallucination.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto vault-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground uppercase tracking-wider text-xs font-semibold">
              <tr>
                <th scope="col" className="px-4 py-4">Date</th>
                <th scope="col" className="px-4 py-4 w-1/4">User Query</th>
                <th scope="col" className="px-4 py-4 w-1/3">AI Answer</th>
                <th scope="col" className="px-4 py-4">Faithfulness</th>
                <th scope="col" className="px-4 py-4">Relevancy</th>
                <th scope="col" className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {messagesWithQueries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
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

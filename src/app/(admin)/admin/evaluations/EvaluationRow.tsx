"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Markdown from "react-markdown";

type MessageRecord = {
  id: string;
  created_at: string;
  content: string;
  faithfulness_score: number | null;
  relevancy_score: number | null;
  evaluation_status: string | null;
  userQuery: string;
};

function ScoreBadge({ score, label }: { score: number | null; label: string }) {
  if (score === null || score === undefined) {
    return <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">Pending</span>;
  }

  const percentage = Math.round(score * 100);
  
  let colorClass = "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
  if (score < 0.5) {
    colorClass = "bg-destructive/10 text-destructive ring-destructive/20";
  } else if (score < 0.85) {
    colorClass = "bg-amber-100 text-amber-800 ring-amber-600/20";
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colorClass}`}>
        {percentage}%
      </span>
    </div>
  );
}

export function EvaluationRow({ record }: { record: MessageRecord }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formattedDate = new Date(record.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const truncate = (text: string, length: number) => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  return (
    <>
      <tr className="border-b border-border hover:bg-muted/30 transition-colors">
        <td className="whitespace-nowrap px-4 py-4 text-sm text-muted-foreground">
          {formattedDate}
        </td>
        <td className="px-4 py-4 text-sm text-foreground max-w-xs truncate">
          <div className="font-medium truncate">{record.userQuery}</div>
        </td>
        <td className="px-4 py-4 text-sm text-muted-foreground max-w-xs">
          <div className="line-clamp-2">{truncate(record.content, 120)}</div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            View Full
          </button>
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm">
          <ScoreBadge score={record.faithfulness_score} label="Faithfulness" />
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm">
          <ScoreBadge score={record.relevancy_score} label="Relevancy" />
        </td>
        <td className="whitespace-nowrap px-4 py-4 text-sm">
          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            record.evaluation_status === 'completed' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {record.evaluation_status === 'completed' ? 'Evaluated' : 'Pending'}
          </span>
        </td>
      </tr>

      {/* Full Answer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-bold font-heading mb-6 text-primary">Evaluation Details</h2>
            
            <div className="space-y-6">
              <div className="space-y-2 rounded-lg bg-surface-vault p-4 border border-border">
                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">User Query</h3>
                <p className="text-foreground leading-relaxed">{record.userQuery}</p>
              </div>

              <div className="space-y-2 rounded-lg bg-surface-elevated p-4 border border-border">
                <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">AI Answer</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed vault-scrollbar">
                  <Markdown>{record.content}</Markdown>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground font-medium mb-2">Faithfulness</span>
                  <ScoreBadge score={record.faithfulness_score} label="Faithfulness" />
                </div>
                <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
                  <span className="text-sm text-muted-foreground font-medium mb-2">Answer Relevancy</span>
                  <ScoreBadge score={record.relevancy_score} label="Relevancy" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

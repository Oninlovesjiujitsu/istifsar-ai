"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  
  let colorClass = "bg-sage/10 text-sage ring-sage/20 font-serif";
  if (score < 0.5) {
    colorClass = "bg-destructive/10 text-destructive ring-destructive/20";
  } else if (score < 0.85) {
    colorClass = "bg-gold/10 border border-gold/40 text-gold-dim dark:text-gold-bright font-serif";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const modalContent = isModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-md border border-border bg-card parchment-texture p-6 shadow-2xl space-y-6">
        <button 
          onClick={() => setIsModalOpen(false)}
          className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="border-b border-border/60 pb-3">
          <h2 className="text-xl font-bold font-heading text-foreground">Evaluation Details</h2>
          <p className="text-xs font-serif text-muted-foreground">Automated RAG grading trace breakdown</p>
        </div>
        
        <div className="space-y-6 font-serif">
          <div className="space-y-2 rounded-md bg-surface-vault p-4 border border-border/60">
            <h3 className="text-xs font-semibold tracking-wider text-gold-dim uppercase font-serif">User Query</h3>
            <p className="text-foreground leading-relaxed text-sm font-medium">{record.userQuery}</p>
          </div>

          <div className="space-y-2 rounded-md bg-surface-elevated p-4 border border-border/60">
            <h3 className="text-xs font-semibold tracking-wider text-gold-dim uppercase font-serif">AI Response</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed vault-scrollbar font-serif">
              <Markdown>{record.content}</Markdown>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md border border-border/60 bg-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground font-serif uppercase tracking-wider mb-2">Faithfulness Score</span>
              <ScoreBadge score={record.faithfulness_score} label="Faithfulness" />
            </div>
            <div className="rounded-md border border-border/60 bg-card p-4 flex flex-col items-center justify-center text-center">
              <span className="text-xs text-muted-foreground font-serif uppercase tracking-wider mb-2">Answer Relevancy</span>
              <ScoreBadge score={record.relevancy_score} label="Relevancy" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors">
        <td className="whitespace-nowrap px-5 py-4 text-sm text-muted-foreground">
          {formattedDate}
        </td>
        <td className="px-5 py-4 text-sm text-foreground max-w-xs truncate font-medium">
          <div className="truncate">{record.userQuery}</div>
        </td>
        <td className="px-5 py-4 text-sm text-muted-foreground max-w-xs">
          <div className="line-clamp-2">{truncate(record.content, 120)}</div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            View Full Trace
          </button>
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-sm">
          <ScoreBadge score={record.faithfulness_score} label="Faithfulness" />
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-sm">
          <ScoreBadge score={record.relevancy_score} label="Relevancy" />
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-sm">
          <span className={`inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-serif border ${
            record.evaluation_status === 'completed' 
              ? 'bg-primary/10 border-primary/20 text-primary' 
              : 'bg-muted border-border text-muted-foreground'
          }`}>
            {record.evaluation_status === 'completed' ? 'Evaluated' : 'Pending'}
          </span>
        </td>
      </tr>

      {/* Render modal via portal directly on document.body */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}


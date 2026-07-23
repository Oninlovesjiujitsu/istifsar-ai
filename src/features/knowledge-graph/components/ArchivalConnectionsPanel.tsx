'use client';

import { useState, useTransition } from 'react';
import { extractDocumentKG } from '@/src/features/knowledge-graph/actions/kg-extract';
import type { DocumentKGData } from '@/src/features/knowledge-graph/actions/kg-fetch';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  HelpCircleIcon,
  RefreshIcon,
  UserGroupIcon,
  Location01Icon,
  Calendar01Icon,
  BookOpen02Icon,
  QuotesIcon,
  Share01Icon,
  CheckmarkCircle02Icon,
} from '@hugeicons/core-free-icons';

type Props = {
  documentId: string;
  initialData: DocumentKGData;
};

const ENTITY_TYPE_LABELS: Record<string, { label: string; icon: typeof UserGroupIcon; color: string }> = {
  HISTORIAN: { label: 'Historical Figures & Scholars', icon: UserGroupIcon, color: 'text-amber-600 bg-amber-500/10 border-amber-500/20' },
  EVENT: { label: 'Historical Events', icon: BookOpen02Icon, color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' },
  LOCATION: { label: 'Locations & Landmarks', icon: Location01Icon, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
  DATE: { label: 'Dates & Eras', icon: Calendar01Icon, color: 'text-purple-600 bg-purple-500/10 border-purple-500/20' },
  CLAIM: { label: 'Scholarly Claims & Arguments', icon: QuotesIcon, color: 'text-rose-600 bg-rose-500/10 border-rose-500/20' },
  SOURCE_REFERENCE: { label: 'Cited Primary Sources', icon: BookOpen02Icon, color: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20' },
  CONCEPT: { label: 'Themes & Movements', icon: Share01Icon, color: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20' },
};

export default function ArchivalConnectionsPanel({ documentId, initialData }: Props) {
  const [data, setData] = useState<DocumentKGData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [showGuide, setShowGuide] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRescan = () => {
    setMessage(null);
    startTransition(async () => {
      const res = await extractDocumentKG(documentId);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `Scan complete! Identified ${res.entities ?? 0} historical connections and ${res.relationships ?? 0} relationship linkages.`,
        });
        // Reload page data
        window.location.reload();
      } else {
        setMessage({
          type: 'error',
          text: res.error ?? 'Failed to re-scan manuscript connections.',
        });
      }
    });
  };

  // Group entities by type
  const groupedEntities = data.entities.reduce((acc, entity) => {
    const type = entity.entity_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(entity);
    return acc;
  }, {} as Record<string, typeof data.entities>);

  return (
    <div className="mt-10 rounded-xl border border-border/80 bg-card p-5 sm:p-7 shadow-sm space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
            Manuscript Network
          </div>
          <h2 className="text-xl font-heading font-semibold text-foreground flex items-center gap-2">
            Archival Knowledge Connections
            <button
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="text-muted-foreground hover:text-primary transition-colors p-1"
              title="What is this?"
              aria-label="Toggle explanation guide"
            >
              <HugeiconsIcon icon={HelpCircleIcon} size={18} />
            </button>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Historical figures, events, primary citations, and scholar arguments indexed from your text.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRescan}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2.5 rounded-lg hover:bg-foreground hover:text-background transition-all disabled:opacity-50 shrink-0 shadow-sm"
        >
          <HugeiconsIcon icon={RefreshIcon} size={16} className={isPending ? 'animate-spin' : ''} />
          <span>{isPending ? 'Scanning Manuscript...' : 'Re-scan Manuscript Connections'}</span>
        </button>
      </div>

      {/* Message feedback */}
      {message && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2 ${message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-700 border border-red-500/20'
            }`}
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Historian Explanatory Guide Box */}
      {showGuide && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-xs sm:text-sm space-y-3 animate-in fade-in duration-200">
          <div className="font-semibold text-primary flex items-center gap-2">
            <HugeiconsIcon icon={HelpCircleIcon} size={16} />
            Guide for Historians: Understanding Knowledge Connections
          </div>
          <div className="space-y-2 text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">What is this?</strong> When you upload a manuscript, our AI reads the text to identify specific historical entities (named scholars, events, locations, dates, and core arguments).
            </p>
            <p>
              <strong className="text-foreground">Why it matters:</strong> These entities link your manuscript into Istifsar AI&apos;s archival graph network. When readers search historical queries, the AI connects your work to related publications and highlights historical debates (*Nodes of Contention*).
            </p>
            <p>
              <strong className="text-foreground">When to re-scan:</strong> If you edit your transcription or upload a new manuscript scan, click <strong className="text-foreground">&quot;Re-scan Manuscript Connections&quot;</strong> to update the archival index.
            </p>
          </div>
        </div>
      )}

      {/* Extracted Entities Grid */}
      {data.entities.length === 0 ? (
        <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed border-border/60">
          <p className="text-sm text-muted-foreground">
            No historical entities have been indexed for this manuscript yet.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click &quot;Re-scan Manuscript Connections&quot; above to run the initial analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEntities).map(([type, entities]) => {
            const config = ENTITY_TYPE_LABELS[type] ?? {
              label: type,
              icon: UserGroupIcon,
              color: 'text-gray-600 bg-gray-100 border-gray-200',
            };
            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <HugeiconsIcon icon={config.icon} size={15} className="text-primary" />
                  <span>{config.label} ({entities.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {entities.map((entity) => (
                    <div
                      key={entity.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border ${config.color}`}
                      title={entity.excerpt ? `Excerpt: "${entity.excerpt}"` : entity.name}
                    >
                      <span>{entity.name}</span>
                      {entity.aliases.length > 0 && (
                        <span className="text-[10px] opacity-75">
                          ({entity.aliases.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Relationship Linkages */}
      {data.relationships.length > 0 && (
        <div className="pt-4 border-t border-border/40 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Extracted Historical Relationships ({data.relationships.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.relationships.map((rel) => (
              <div key={rel.id} className="p-3 rounded-lg border border-border/60 bg-muted/20 text-xs space-y-1">
                <div className="font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                  <span className="text-primary font-semibold">{rel.source_name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">
                    {rel.relationship_type}
                  </span>
                  <span>{rel.target_name}</span>
                </div>
                {rel.evidence_excerpt && (
                  <p className="text-[11px] text-muted-foreground italic line-clamp-2">
                    &quot;{rel.evidence_excerpt}&quot;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { createAdminClient } from '@/src/lib/supabase/admin';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'Historiographical Contentions — Admin — Istifsar' };

export default async function AdminContentionsPage() {
  const db = createAdminClient();

  const { data: contentions, error } = await db
    .from('contentions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching contentions:', error);
  }

  return (
    <div className="space-y-8 sm:space-y-10 p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold-dim font-serif mb-1">
          <Link href="/admin" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5 inline" /> Admin Console
          </Link>
          <span>/</span>
          <span>Contention Registry</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground tracking-tight">
          Historiographical Contentions
        </h1>
        <p className="mt-1 text-base text-muted-foreground font-serif italic">
          Audit detected factual contradictions between historical sources in the archive.
        </p>
      </div>

      {/* Contentions Container */}
      <div className="space-y-4">
        {(!contentions || contentions.length === 0) ? (
          <div className="rounded-md border border-border/80 bg-card parchment-texture p-12 text-center shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-sage/80 mx-auto mb-3" />
            <h3 className="font-heading text-lg font-semibold text-foreground">No Active Contentions</h3>
            <p className="text-sm font-serif text-muted-foreground mt-1">
              All indexed scholar publications present unified consensus without detected factual contradictions.
            </p>
          </div>
        ) : (
          contentions.map((contention) => {
            const isResolved = contention.status === 'resolved';
            return (
              <div
                key={contention.id}
                className="rounded-md border border-border/80 bg-card parchment-texture p-6 shadow-sm space-y-4 hover:border-gold/40 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className={`h-5 w-5 shrink-0 ${isResolved ? 'text-muted-foreground' : 'text-gold-dim dark:text-gold-bright'}`} />
                    <h3 className="font-heading font-semibold text-lg text-foreground">
                      {contention.title}
                    </h3>
                  </div>
                  <span
                    className={`self-start sm:self-auto inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-serif border ${
                      isResolved
                        ? 'bg-sage/10 border-sage/20 text-sage font-serif'
                        : 'bg-gold/10 border-gold/40 text-gold-dim dark:text-gold-bright font-serif'
                    }`}
                  >
                    {isResolved ? 'Resolved' : 'Open Contention'}
                  </span>
                </div>

                {contention.description && (
                  <p className="text-sm font-serif text-muted-foreground leading-relaxed">
                    {contention.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs font-serif text-muted-foreground border-t border-border/30">
                  <span>
                    Detected: {new Date(contention.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span>
                    Referenced Documents: {contention.document_ids?.length || 0} source(s)
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

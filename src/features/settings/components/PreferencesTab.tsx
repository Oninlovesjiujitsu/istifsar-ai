'use client';

import { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BookOpen02Icon,
  Tick02Icon,
  AlertCircleIcon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { updateUserPreferencesAction } from '@/src/features/settings/actions/settingsActions';
import type { UserPreferences, CitationStyle, AiResponseDepth } from '@/src/types/preferences';

interface PreferencesTabProps {
  preferences: UserPreferences;
}

export default function PreferencesTab({ preferences }: PreferencesTabProps) {
  const [citationStyle, setCitationStyle] = useState<CitationStyle>(
    preferences.citation_style || 'chicago',
  );
  const [aiDepth, setAiDepth] = useState<AiResponseDepth>(
    preferences.ai_response_depth || 'academic_rigour',
  );

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');

    const res = await updateUserPreferencesAction({
      citation_style: citationStyle,
      ai_response_depth: aiDepth,
    });

    setSaving(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm leading-relaxed">
          <HugeiconsIcon icon={Tick02Icon} size={18} className="shrink-0" />
          <span>AI & Reading preferences saved! Future inquiries will use these defaults.</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm leading-relaxed">
          <HugeiconsIcon icon={AlertCircleIcon} size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Citation Format Defaults */}
      <div className="p-4 sm:p-6 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-4 sm:space-y-5">
        <div className="flex items-start sm:items-center gap-3 border-b border-border pb-3.5 sm:pb-4">
          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <HugeiconsIcon icon={BookOpen02Icon} size={20} className="sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight leading-snug">
              Default Citation Style
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Controls how in-text source citations are formatted in AI responses across `/explore`.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {/* Chicago */}
          <button
            type="button"
            onClick={() => setCitationStyle('chicago')}
            className={[
              'p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-3 min-w-0 w-full',
              citationStyle === 'chicago'
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,0,0,0.05)]'
                : 'border-border/60 hover:border-primary/30 bg-background/50',
            ].join(' ')}
          >
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground text-xs sm:text-sm truncate">Chicago Style</span>
                {citationStyle === 'chicago' && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Tick02Icon} size={14} />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                Notes & Bibliography format with numbered brackets <span className="font-mono text-primary">[1]</span>.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-primary font-medium mt-1">Standard Academic</span>
          </button>

          {/* APA */}
          <button
            type="button"
            onClick={() => setCitationStyle('apa')}
            className={[
              'p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-3 min-w-0 w-full',
              citationStyle === 'apa'
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,0,0,0.05)]'
                : 'border-border/60 hover:border-primary/30 bg-background/50',
            ].join(' ')}
          >
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground text-xs sm:text-sm truncate">APA 7th Edition</span>
                {citationStyle === 'apa' && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Tick02Icon} size={14} />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                Author-date parentheticals, e.g. <span className="font-mono text-primary">(Agoncillo, 1956)</span>.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-primary font-medium mt-1">Social Sciences</span>
          </button>

          {/* MLA */}
          <button
            type="button"
            onClick={() => setCitationStyle('mla')}
            className={[
              'p-4 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-3 min-w-0 w-full sm:col-span-2 lg:col-span-1',
              citationStyle === 'mla'
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,0,0,0.05)]'
                : 'border-border/60 hover:border-primary/30 bg-background/50',
            ].join(' ')}
          >
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground text-xs sm:text-sm truncate">MLA 9th Edition</span>
                {citationStyle === 'mla' && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Tick02Icon} size={14} />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                Author-reference parentheticals, e.g. <span className="font-mono text-primary">(Agoncillo [1])</span>.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-primary font-medium mt-1">Humanities Focus</span>
          </button>
        </div>
      </div>

      {/* Section 2: AI Response Depth */}
      <div className="p-4 sm:p-6 rounded-xl border border-border bg-card/60 backdrop-blur-md space-y-4 sm:space-y-5">
        <div className="flex items-start sm:items-center gap-3 border-b border-border pb-3.5 sm:pb-4">
          <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
            <HugeiconsIcon icon={SparklesIcon} size={20} className="sm:w-[22px] sm:h-[22px]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight leading-snug">
              AI Response Depth & Style
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
              Select how deep and detailed the AI synthesis should be when answering inquiries.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Academic Rigour */}
          <button
            type="button"
            onClick={() => setAiDepth('academic_rigour')}
            className={[
              'p-4 sm:p-5 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-3.5 min-w-0 w-full',
              aiDepth === 'academic_rigour'
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,0,0,0.05)]'
                : 'border-border/60 hover:border-primary/30 bg-background/50',
            ].join(' ')}
          >
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground text-sm sm:text-base truncate">Academic Rigour</span>
                {aiDepth === 'academic_rigour' && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Tick02Icon} size={14} />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                Exhaustive, deeply analytical synthesis of source documents. Examines methodological tensions, historiographical nuances, and detailed quotes.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-primary font-medium mt-1">
              <HugeiconsIcon icon={BookOpen02Icon} size={16} className="shrink-0" />
              <span className="truncate">Recommended for Researchers & Historians</span>
            </div>
          </button>

          {/* Concise Overview */}
          <button
            type="button"
            onClick={() => setAiDepth('concise_overview')}
            className={[
              'p-4 sm:p-5 rounded-lg border text-left transition-all relative flex flex-col justify-between gap-3.5 min-w-0 w-full',
              aiDepth === 'concise_overview'
                ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(0,0,0,0.05)]'
                : 'border-border/60 hover:border-primary/30 bg-background/50',
            ].join(' ')}
          >
            <div className="space-y-2 w-full">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-foreground text-sm sm:text-base truncate">Concise Overview</span>
                {aiDepth === 'concise_overview' && (
                  <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <HugeiconsIcon icon={Tick02Icon} size={14} />
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed break-words">
                Streamlined, executive summaries prioritizing bullet points and high-level historical facts for quick reading while maintaining 100% source fidelity.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-primary font-medium mt-1">
              <HugeiconsIcon icon={SparklesIcon} size={16} className="shrink-0" />
              <span className="truncate">Recommended for Quick Reading & Students</span>
            </div>
          </button>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-medium text-xs sm:text-sm hover:bg-primary/90 transition-all disabled:opacity-50 shadow-sm uppercase sm:normal-case tracking-wider sm:tracking-normal"
          >
            {saving ? 'Saving Preferences...' : 'Save AI Preferences'}
          </button>
        </div>
      </div>
    </form>
  );
}

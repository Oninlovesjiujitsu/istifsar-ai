import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import NewConversationButton from '@/components/chat/NewConversationButton';
import DiscoveryPromptButton from '@/components/chat/DiscoveryPromptButton';
import StatsStrip from '@/components/explore/StatsStrip';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Explore — Istifsar' };

const DISCOVERY_PROMPTS = [
  'What were the causes of the Philippine Revolution?',
  'How did colonial powers justify their presence in Southeast Asia?',
  'Who were the key figures of the Propaganda Movement?',
  'What role did religion play in early Philippine society?',
];

export default async function ExplorePage() {
  await proxy({ requireAuth: true });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, mode, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-14">
      {/* Hero */}
      <section className="space-y-5 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Explore history,{' '}
          <span className="text-primary">one question at a time.</span>
        </h1>
        <p className="mx-auto max-w-lg text-muted-foreground text-lg leading-relaxed">
          Every answer is drawn from verified primary sources — no speculation, no
          generalization. If the archive doesn&apos;t have it, we&apos;ll say so honestly.
        </p>
        <div className="flex justify-center">
          <NewConversationButton />
        </div>
      </section>

      {/* Discovery prompts */}
      <section className="space-y-4">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Not sure where to start? Try asking:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {DISCOVERY_PROMPTS.map((q) => (
            <DiscoveryPromptButton key={q} question={q} />
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="rounded-xl border bg-muted/30 px-6 py-5 text-center">
        <StatsStrip />
      </section>

      {/* Recent conversations */}
      {conversations && conversations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your recent conversations
          </h2>
          <ul className="divide-y divide-border rounded-lg border">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/explore/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="truncate font-medium">
                      {c.title ?? 'Untitled conversation'}
                    </span>
                    {c.mode === 'interpreted' && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Historian&apos;s Perspective
                      </span>
                    )}
                  </div>
                  <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                    {new Date(c.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Browse section */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Or explore the collection
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/documents"
            className="group rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <p className="font-medium group-hover:text-primary transition-colors">
              Primary sources →
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Browse the full archive</p>
          </Link>
          <Link
            href="/paths"
            className="group rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <p className="font-medium group-hover:text-primary transition-colors">
              Knowledge paths →
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Curated journeys through history</p>
          </Link>
          <Link
            href="/essays"
            className="group rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
          >
            <p className="font-medium group-hover:text-primary transition-colors">
              Perspectives →
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Historians&apos; interpretations</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

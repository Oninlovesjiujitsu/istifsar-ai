import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import NewConversationButton from '@/components/chat/NewConversationButton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Explore — Istifsar' };

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Explore history</h1>
        <p className="text-muted-foreground">
          Ask questions grounded in verified primary sources.
        </p>
      </div>

      <NewConversationButton />

      {conversations && conversations.length > 0 && (
        <div className="mt-10 space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent conversations
          </h2>
          <ul className="divide-y divide-border rounded-lg border">
            {conversations.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/explore/${c.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
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
        </div>
      )}
    </div>
  );
}

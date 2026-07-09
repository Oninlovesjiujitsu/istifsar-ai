import { createClient } from '@/src/lib/supabase/server';

export default async function StatsStrip() {
  const supabase = await createClient();

  const [{ count: docCount }, { count: pathCount }, { count: essayCount }] = await Promise.all([
    supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('knowledge_paths')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
    supabase
      .from('living_essays')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published'),
  ]);

  const stats = [
    { value: docCount ?? 0, label: 'primary sources' },
    { value: pathCount ?? 0, label: 'knowledge paths' },
    { value: essayCount ?? 0, label: 'perspectives' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
      {stats.map((s, i) => (
        <span key={s.label}>
          <span className="font-semibold text-foreground">{s.value.toLocaleString()}</span>{' '}
          {s.label}
          {i < stats.length - 1 && (
            <span className="ml-8 hidden sm:inline text-border">·</span>
          )}
        </span>
      ))}
    </div>
  );
}

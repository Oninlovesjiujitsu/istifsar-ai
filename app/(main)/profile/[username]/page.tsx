import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

const TIER_LABELS: Record<string, string> = {
  pending: 'Newcomer',
  reader: 'Reader',
  tier_3: 'Contributor',
  tier_2: 'Historian',
  tier_1: 'Senior Historian',
  admin: 'Curator',
};

const TIER_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  reader: 'bg-blue-100 text-blue-700',
  tier_3: 'bg-cyan-100 text-cyan-700',
  tier_2: 'bg-violet-100 text-violet-700',
  tier_1: 'bg-amber-100 text-amber-700',
  admin: 'bg-red-100 text-red-700',
};

/** Warm avatar color from display name initial */
function avatarColor(name: string): string {
  const colors = [
    'bg-amber-200 text-amber-800',
    'bg-rose-200 text-rose-800',
    'bg-emerald-200 text-emerald-800',
    'bg-sky-200 text-sky-800',
    'bg-violet-200 text-violet-800',
    'bg-orange-200 text-orange-800',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Istifsar` };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, institution, tier, created_at, avatar_url')
    .eq('username', username)
    .single();

  if (!profile) notFound();

  const [
    { data: documents },
    { data: essays },
    { data: paths },
  ] = await Promise.all([
    supabase
      .from('documents')
      .select('id, title, document_type, published_at, status')
      .eq('submitter_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('living_essays')
      .select('id, title, slug, published_at')
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
    supabase
      .from('knowledge_paths')
      .select('id, title, slug, published_at')
      .eq('author_id', profile.id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6),
  ]);

  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const initial = profile.display_name.charAt(0).toUpperCase();
  const avatarClass = avatarColor(profile.display_name);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Avatar */}
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${avatarClass}`}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TIER_BADGE[profile.tier] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {TIER_LABELS[profile.tier] ?? profile.tier}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.institution && (
            <p className="text-sm text-muted-foreground">{profile.institution}</p>
          )}
          {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}
          <p className="text-xs text-muted-foreground">Exploring since {joinDate}</p>
        </div>
      </div>

      {/* Contributions */}
      {documents && documents.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Primary sources contributed</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="group rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow space-y-1"
              >
                <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors text-sm">
                  {doc.title}
                </p>
                {doc.document_type && (
                  <p className="text-xs text-muted-foreground capitalize">
                    {doc.document_type.replace(/_/g, ' ')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {essays && essays.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Perspectives written</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {essays.map((essay) => (
              <Link
                key={essay.id}
                href={`/essays/${essay.slug}`}
                className="group rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors text-sm">
                  {essay.title}
                </p>
                {essay.published_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(essay.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {paths && paths.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Learning paths created</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`/paths/${path.slug}`}
                className="group rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
              >
                <p className="font-medium line-clamp-2 group-hover:text-primary transition-colors text-sm">
                  {path.title}
                </p>
                {path.published_at && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(path.published_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!documents || documents.length === 0) &&
        (!essays || essays.length === 0) &&
        (!paths || paths.length === 0) && (
          <div className="rounded-lg border bg-muted/20 py-12 text-center">
            <p className="text-muted-foreground">
              No published contributions yet — check back soon.
            </p>
          </div>
        )}
    </div>
  );
}

import Link from 'next/link';
import { ROLE_BADGE, ROLE_LABELS } from '@/lib/ui/role-labels';

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

type Profile = {
  display_name: string;
  username: string;
  bio: string | null;
  institution: string | null;
  role: string;
  created_at: string;
  avatar_url: string | null;
};

type Document = {
  id: string;
  title: string;
  document_type: string | null;
  published_at: string | null;
  status: string;
};

type Essay = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
};

type KnowledgePath = {
  id: string;
  title: string;
  slug: string;
  published_at: string | null;
};

export default function ProfileContent({
  profile,
  publications,
  essays,
  paths,
  citationCount = 0,
}: {
  profile: Profile;
  publications: Document[] | null;
  essays: Essay[] | null;
  paths: KnowledgePath[] | null;
  citationCount?: number;
}) {
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const initial = profile.display_name.charAt(0).toUpperCase();
  const avatarClass = avatarColor(profile.display_name);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${avatarClass}`}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[profile.role] ?? ROLE_BADGE.reader}`}
            >
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
          {profile.institution && (
            <p className="text-sm text-muted-foreground">{profile.institution}</p>
          )}
          {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}
          <p className="text-xs text-muted-foreground">Exploring since {joinDate}</p>
          {citationCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {citationCount} {citationCount === 1 ? 'citation' : 'citations'} across published writings
            </p>
          )}
        </div>
      </div>

      {publications && publications.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Primary sources contributed</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((doc) => (
              <Link
                key={doc.id}
                href={`/publications/${doc.id}`}
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Perspectives written</h2>
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
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Learning paths created</h2>
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

      {(!publications || publications.length === 0) &&
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

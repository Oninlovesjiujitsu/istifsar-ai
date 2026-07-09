import Link from 'next/link';
import { ROLE_LABELS } from '@/src/lib/ui/role-labels';

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
  const isHistorian = profile.role === 'verified_historian' || profile.role === 'admin';
  const pubCount = publications?.length ?? 0;
  const essayCount = essays?.length ?? 0;
  const hasContent = pubCount > 0 || essayCount > 0 || (paths?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-14">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6 sm:gap-8">
        {/* Avatar */}
        <div
          className={[
            'relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-full text-3xl font-bold',
            avatarClass,
            isHistorian ? 'ring-2 ring-gold/60 ring-offset-2 ring-offset-background' : '',
          ].join(' ')}
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

        {/* Identity */}
        <div className="space-y-2 min-w-0">
          <div className="flex flex-col sm:flex-row flex-wrap items-center sm:items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight">
              {profile.display_name}
            </h1>
            <span
              className={[
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                isHistorian
                  ? 'bg-gold/15 text-gold-dim dark:bg-gold/20 dark:text-gold'
                  : 'bg-muted text-muted-foreground',
              ].join(' ')}
            >
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">@{profile.username}</p>

          {profile.institution && (
            <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <svg className="size-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
              {profile.institution}
            </p>
          )}

          {profile.bio && (
            <p className="text-sm leading-relaxed max-w-prose">
              {profile.bio}
            </p>
          )}

          <p className="text-xs text-muted-foreground pt-1">
            Exploring since {joinDate}
          </p>
        </div>
      </div>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      {(pubCount > 0 || citationCount > 0 || essayCount > 0) && (
        <div className="mt-8 sm:mt-10 grid grid-cols-3 divide-x divide-border rounded-lg border bg-card">
          <StatCell value={pubCount} label="Sources" />
          <StatCell value={essayCount} label="Perspectives" />
          <StatCell value={citationCount} label="Citations" />
        </div>
      )}

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      {hasContent && (
        <div className="my-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Contributions
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* ── Publications ────────────────────────────────────────────────── */}
      {publications && publications.length > 0 && (
        <section className="space-y-4">
          <SectionHeading>Primary sources contributed</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/all/${doc.id}`}
                className="group rounded-lg border bg-card p-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-md hover:border-gold/30 space-y-2"
              >
                <p className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors text-sm">
                  {doc.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {doc.document_type && (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium capitalize">
                      {doc.document_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {doc.published_at && (
                    <span>
                      {new Date(doc.published_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Essays ──────────────────────────────────────────────────────── */}
      {essays && essays.length > 0 && (
        <section className={publications && publications.length > 0 ? 'mt-10 space-y-4' : 'space-y-4'}>
          <SectionHeading>Perspectives written</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {essays.map((essay) => (
              <Link
                key={essay.id}
                href={`/essays/${essay.slug}`}
                className="group rounded-lg border bg-card p-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-md hover:border-gold/30 space-y-2"
              >
                <p className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors text-sm">
                  {essay.title}
                </p>
                {essay.published_at && (
                  <p className="text-xs text-muted-foreground">
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

      {/* ── Knowledge paths ─────────────────────────────────────────────── */}
      {paths && paths.length > 0 && (
        <section className="mt-10 space-y-4">
          <SectionHeading>Learning paths created</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`/paths/${path.slug}`}
                className="group rounded-lg border bg-card p-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-md hover:border-gold/30 space-y-2"
              >
                <p className="font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors text-sm">
                  {path.title}
                </p>
                {path.published_at && (
                  <p className="text-xs text-muted-foreground">
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

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!hasContent && (
        <div className="mt-10 rounded-lg border border-dashed bg-muted/20 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            No published contributions yet — check back soon.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center py-4 sm:py-5 gap-0.5">
      <span className="text-xl sm:text-2xl font-heading font-bold text-primary tabular-nums">
        {value}
      </span>
      <span className="text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
      {children}
    </h2>
  );
}

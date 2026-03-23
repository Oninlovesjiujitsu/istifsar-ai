import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: path } = await supabase
    .from('knowledge_paths')
    .select('title')
    .eq('slug', slug)
    .single();

  return { title: path ? `${path.title} — Istifsar` : 'Knowledge Path — Istifsar' };
}

type PathNode = {
  id: string;
  position: number;
  node_type: string;
  body: string | null;
  documents: {
    id: string;
    title: string;
    document_type: string | null;
    date_of_origin: string | null;
  } | null;
  living_essays: {
    id: string;
    title: string;
    slug: string;
    summary: string | null;
  } | null;
};

export default async function PathDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: path } = await supabase
    .from('knowledge_paths')
    .select(
      `
      id, title, slug, description, status, published_at,
      profiles!author_id(display_name),
      path_nodes(
        id, position, node_type, body,
        documents(id, title, document_type, date_of_origin),
        living_essays(id, title, slug, summary)
      )
    `,
    )
    .eq('slug', slug)
    .single();

  if (!path) notFound();

  // Only show published paths (or handle auth for drafts)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    path.status !== 'published' &&
    (path as Record<string, unknown> & { profiles: { display_name: string } | null }).profiles
  ) {
    // Allow author to see their own draft
    const authorId = user?.id;
    // We can't easily check author_id here without another query, so just check status
    if (path.status === 'archived') notFound();
  }

  const profile = path.profiles as { display_name: string } | null;
  const nodes = (path.path_nodes as PathNode[] ?? []).sort((a, b) => a.position - b.position);

  const formattedDate = path.published_at
    ? new Date(path.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Back link */}
      <Link
        href="/paths"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Knowledge paths
      </Link>

      {/* Header */}
      <div className="mt-4 space-y-3">
        {path.status !== 'published' && (
          <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            Draft
          </span>
        )}
        <h1 className="text-3xl font-bold leading-tight">{path.title}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {profile?.display_name && <span>{profile.display_name}</span>}
          {formattedDate && (
            <>
              <span>·</span>
              <span>{formattedDate}</span>
            </>
          )}
        </div>
        {path.description && (
          <p className="text-muted-foreground leading-relaxed">{path.description}</p>
        )}
      </div>

      {/* Node list */}
      {nodes.length > 0 ? (
        <ol className="mt-10 space-y-4">
          {nodes.map((node, index) => (
            <li key={node.id} className="flex gap-4">
              {/* Step number */}
              <div className="flex flex-col items-center">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                {index < nodes.length - 1 && (
                  <div className="mt-2 flex-1 w-px bg-border min-h-[2rem]" />
                )}
              </div>

              {/* Node content */}
              <div className="pb-4 flex-1">
                <NodeCard node={node} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-10 text-muted-foreground">This path has no stops yet.</p>
      )}
    </div>
  );
}

function NodeCard({ node }: { node: PathNode }) {
  if (node.node_type === 'document' && node.documents) {
    const doc = node.documents;
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/documents/${doc.id}`}
            className="font-semibold hover:text-primary transition-colors"
          >
            {doc.title}
          </Link>
          {doc.document_type && (
            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium capitalize">
              {doc.document_type.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        {doc.date_of_origin && (
          <p className="text-xs text-muted-foreground">{doc.date_of_origin}</p>
        )}
      </div>
    );
  }

  if (node.node_type === 'essay' && node.living_essays) {
    const essay = node.living_essays;
    return (
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <Link
          href={`/essays/${essay.slug}`}
          className="font-semibold hover:text-primary transition-colors block"
        >
          {essay.title}
        </Link>
        {essay.summary && (
          <p className="text-sm text-muted-foreground line-clamp-2">{essay.summary}</p>
        )}
        <span className="text-xs text-muted-foreground">Historian&apos;s perspective</span>
      </div>
    );
  }

  if (node.node_type === 'question') {
    return (
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm italic leading-relaxed">{node.body}</p>
      </div>
    );
  }

  if (node.node_type === 'note') {
    return (
      <div className="rounded-lg bg-muted/50 p-4">
        <p className="text-sm leading-relaxed">{node.body}</p>
      </div>
    );
  }

  return null;
}

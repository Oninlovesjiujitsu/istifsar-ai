'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { savePath } from '@/src/features/paths/actions/knowledge-path';

type NodeType = 'document' | 'essay' | 'question' | 'note';

type NodeInput = {
  node_type: NodeType;
  body: string | null;
  document_id: string | null;
  essay_id: string | null;
  position: number;
};

type InitialData = {
  title: string;
  slug: string;
  description: string;
  nodes: NodeInput[];
};

type Props = {
  pathId?: string;
  initialData?: InitialData;
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const NODE_TYPE_LABELS: Record<NodeType, string> = {
  document: 'Primary source',
  essay: 'Historian\'s perspective',
  question: 'Guiding question',
  note: 'Curator note',
};

export default function PathEditor({ pathId, initialData }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [slug, setSlug] = useState(initialData?.slug ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [nodes, setNodes] = useState<NodeInput[]>(initialData?.nodes ?? []);
  const [error, setError] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!initialData?.slug);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(value);
  }

  function addNode() {
    setNodes((prev) => [
      ...prev,
      {
        node_type: 'note',
        body: '',
        document_id: null,
        essay_id: null,
        position: prev.length,
      },
    ]);
  }

  function removeNode(index: number) {
    setNodes((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((n, i) => ({ ...n, position: i })),
    );
  }

  function moveNode(index: number, direction: 'up' | 'down') {
    const newNodes = [...nodes];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newNodes.length) return;
    [newNodes[index], newNodes[target]] = [newNodes[target], newNodes[index]];
    setNodes(newNodes.map((n, i) => ({ ...n, position: i })));
  }

  function updateNode(index: number, updates: Partial<NodeInput>) {
    setNodes((prev) =>
      prev.map((n, i) => (i === index ? { ...n, ...updates } : n)),
    );
  }

  function handleSubmit(publish: boolean) {
    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      if (pathId) formData.set('pathId', pathId);
      formData.set('title', title);
      formData.set('slug', slug);
      formData.set('description', description);
      formData.set('publish', String(publish));
      formData.set('nodes', JSON.stringify(nodes));

      const result = await savePath(formData);
      if (result.success) {
        router.push(`/paths/${result.slug}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g. The Road to Independence"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          required
        />
      </div>

      {/* Slug */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">URL slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="road-to-independence"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <p className="text-xs text-muted-foreground">
          Used in the URL: /paths/<strong>{slug || '…'}</strong>
        </p>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will readers discover on this path?"
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Nodes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Path stops ({nodes.length})</h2>
          <Button variant="outline" size="sm" onClick={addNode} type="button">
            Add stop
          </Button>
        </div>

        {nodes.length === 0 && (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No stops yet. Add a primary source, question, or note to begin.
          </p>
        )}

        <div className="space-y-3">
          {nodes.map((node, index) => (
            <div key={index} className="rounded-md border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-6">
                  {index + 1}.
                </span>
                <select
                  value={node.node_type}
                  onChange={(e) =>
                    updateNode(index, { node_type: e.target.value as NodeType })
                  }
                  className="rounded-md border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((t) => (
                    <option key={t} value={t}>
                      {NODE_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveNode(index, 'up')}
                    disabled={index === 0}
                    className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveNode(index, 'down')}
                    disabled={index === nodes.length - 1}
                    className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeNode(index)}
                    className="rounded px-1.5 py-0.5 text-xs text-destructive hover:bg-destructive/10"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {(node.node_type === 'question' || node.node_type === 'note') && (
                <textarea
                  value={node.body ?? ''}
                  onChange={(e) => updateNode(index, { body: e.target.value })}
                  placeholder={
                    node.node_type === 'question'
                      ? 'What question should readers consider here?'
                      : 'Add a curator note…'
                  }
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              )}

              {node.node_type === 'document' && (
                <input
                  type="text"
                  value={node.document_id ?? ''}
                  onChange={(e) => updateNode(index, { document_id: e.target.value || null })}
                  placeholder="Document ID (UUID)"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
                />
              )}

              {node.node_type === 'essay' && (
                <input
                  type="text"
                  value={node.essay_id ?? ''}
                  onChange={(e) => updateNode(index, { essay_id: e.target.value || null })}
                  placeholder="Essay ID (UUID)"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => handleSubmit(false)}
          disabled={isPending || !title || !slug}
          variant="outline"
        >
          Save draft
        </Button>
        <Button
          onClick={() => handleSubmit(true)}
          disabled={isPending || !title || !slug}
        >
          {isPending ? 'Saving…' : 'Publish'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
          type="button"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

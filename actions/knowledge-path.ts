'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

type NodeInput = {
  node_type: string;
  body: string | null;
  document_id: string | null;
  essay_id: string | null;
  position: number;
};

export async function savePath(formData: FormData): Promise<
  | { success: true; pathId: string; slug: string }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  const tier = (user.app_metadata?.tier as string | undefined) ?? 'pending';
  const tierRank: Record<string, number> = {
    pending: 0, reader: 1, tier_3: 2, tier_2: 3, tier_1: 4, admin: 5,
  };
  if ((tierRank[tier] ?? 0) < tierRank['tier_3']) {
    return { success: false, error: 'Insufficient permissions.' };
  }

  const pathId = formData.get('pathId') as string | null;
  const title = (formData.get('title') as string | null)?.trim();
  const slug = (formData.get('slug') as string | null)?.trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const publish = formData.get('publish') === 'true';
  const nodesJson = formData.get('nodes') as string | null;

  if (!title || !slug) {
    return { success: false, error: 'Title and slug are required.' };
  }

  let nodes: NodeInput[] = [];
  try {
    nodes = nodesJson ? JSON.parse(nodesJson) : [];
  } catch {
    return { success: false, error: 'Invalid nodes data.' };
  }

  if (pathId) {
    // Update existing path — verify ownership
    const { data: existing } = await supabase
      .from('knowledge_paths')
      .select('id, author_id')
      .eq('id', pathId)
      .single();

    if (!existing) return { success: false, error: 'Path not found.' };
    if (existing.author_id !== user.id && tier !== 'tier_1' && tier !== 'admin') {
      return { success: false, error: 'Not authorized to edit this path.' };
    }

    const updatePayload: Record<string, unknown> = {
      title,
      slug,
      description,
      updated_at: new Date().toISOString(),
    };
    if (publish) {
      updatePayload.status = 'published';
      updatePayload.published_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('knowledge_paths')
      .update(updatePayload)
      .eq('id', pathId);

    if (updateError) return { success: false, error: updateError.message };

    // Replace nodes
    await supabase.from('path_nodes').delete().eq('path_id', pathId);

    if (nodes.length > 0) {
      const { error: nodesError } = await supabase.from('path_nodes').insert(
        nodes.map((n) => ({ ...n, path_id: pathId })),
      );
      if (nodesError) return { success: false, error: nodesError.message };
    }

    revalidatePath('/paths');
    revalidatePath(`/paths/${slug}`);
    return { success: true, pathId, slug };
  } else {
    // Create new path
    const { data: created, error: createError } = await supabase
      .from('knowledge_paths')
      .insert({
        title,
        slug,
        description,
        author_id: user.id,
        status: publish ? 'published' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (createError || !created) {
      return { success: false, error: createError?.message ?? 'Failed to create path.' };
    }

    if (nodes.length > 0) {
      const { error: nodesError } = await supabase.from('path_nodes').insert(
        nodes.map((n) => ({ ...n, path_id: created.id })),
      );
      if (nodesError) return { success: false, error: nodesError.message };
    }

    revalidatePath('/paths');
    return { success: true, pathId: created.id, slug };
  }
}

export async function deletePath(
  pathId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  const { data: existing } = await supabase
    .from('knowledge_paths')
    .select('id, author_id, slug')
    .eq('id', pathId)
    .single();

  if (!existing) return { success: false, error: 'Path not found.' };

  const tier = (user.app_metadata?.tier as string | undefined) ?? 'pending';
  if (existing.author_id !== user.id && tier !== 'tier_1' && tier !== 'admin') {
    return { success: false, error: 'Not authorized.' };
  }

  await supabase.from('path_nodes').delete().eq('path_id', pathId);
  await supabase.from('knowledge_paths').delete().eq('id', pathId);

  revalidatePath('/paths');
  return { success: true };
}

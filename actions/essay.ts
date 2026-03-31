'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getUserRole, isVerifiedHistorian } from '@/lib/ui/role-labels';

export async function saveEssay(formData: FormData): Promise<
  | { success: true; essayId: string; slug: string }
  | { success: false; error: string }
> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  const role = getUserRole(user);
  if (!isVerifiedHistorian(role)) {
    return { success: false, error: 'Insufficient permissions.' };
  }

  const essayId = formData.get('essayId') as string | null;
  const title = (formData.get('title') as string | null)?.trim();
  const slug = (formData.get('slug') as string | null)?.trim();
  const summary = (formData.get('summary') as string | null)?.trim() || null;
  const lensLabel = (formData.get('lens_label') as string | null)?.trim() || null;
  const content = (formData.get('content') as string | null)?.trim() ?? '';

  if (!title || !slug) {
    return { success: false, error: 'Title and slug are required.' };
  }

  if (essayId) {
    // Update existing essay — verify ownership
    const { data: existing } = await supabase
      .from('living_essays')
      .select('id, author_id')
      .eq('id', essayId)
      .single();

    if (!existing) return { success: false, error: 'Essay not found.' };
    if (existing.author_id !== user.id && role !== 'admin') {
      return { success: false, error: 'Not authorized to edit this essay.' };
    }

    const { error: updateError } = await supabase
      .from('living_essays')
      .update({ title, slug, summary, lens_label: lensLabel, content, updated_at: new Date().toISOString() })
      .eq('id', essayId);

    if (updateError) return { success: false, error: updateError.message };

    revalidatePath('/essays');
    revalidatePath(`/essays/${slug}`);
    return { success: true, essayId, slug };
  } else {
    // Create new essay
    const { data: created, error: createError } = await supabase
      .from('living_essays')
      .insert({
        title,
        slug,
        summary,
        lens_label: lensLabel,
        content,
        author_id: user.id,
        status: 'draft',
      })
      .select('id')
      .single();

    if (createError || !created) {
      return { success: false, error: createError?.message ?? 'Failed to create essay.' };
    }

    revalidatePath('/essays');
    return { success: true, essayId: created.id, slug };
  }
}

export async function submitEssayForReview(
  essayId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  const { data: existing } = await supabase
    .from('living_essays')
    .select('id, author_id, slug')
    .eq('id', essayId)
    .single();

  if (!existing) return { success: false, error: 'Essay not found.' };
  if (existing.author_id !== user.id) {
    return { success: false, error: 'Not authorized.' };
  }

  const { error } = await supabase
    .from('living_essays')
    .update({ status: 'under_review', updated_at: new Date().toISOString() })
    .eq('id', essayId);

  if (error) return { success: false, error: error.message };

  revalidatePath('/essays');
  revalidatePath(`/essays/${existing.slug}`);
  return { success: true };
}

export async function deleteEssay(
  essayId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated.' };

  const { data: existing } = await supabase
    .from('living_essays')
    .select('id, author_id')
    .eq('id', essayId)
    .single();

  if (!existing) return { success: false, error: 'Essay not found.' };

  const role = getUserRole(user);
  if (existing.author_id !== user.id && role !== 'admin') {
    return { success: false, error: 'Not authorized.' };
  }

  const { error } = await supabase.from('living_essays').delete().eq('id', essayId);
  if (error) return { success: false, error: error.message };

  revalidatePath('/essays');
  return { success: true };
}

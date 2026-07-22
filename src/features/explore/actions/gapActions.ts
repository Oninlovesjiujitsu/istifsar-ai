'use server';

import { createClient } from '@/src/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { classifyUserRequest } from '@/src/lib/ai/categorizeGap';

export async function createArchivalRequestAction(data: {
  title: string;
  description?: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'You must be signed in to post a request.' };
  }

  const title = data.title.trim();
  const description = data.description?.trim() || null;

  if (!title || title.length < 3) {
    return { success: false, error: 'Title must be at least 3 characters long.' };
  }

  // AI Classification & Spam Detection
  const classification = await classifyUserRequest(title, description);

  if (!classification.isRelevant) {
    return {
      success: false,
      error: classification.reason || 'This request does not appear to be a valid historical or archival inquiry.',
    };
  }

  const { data: newGap, error } = await supabase
    .from('archive_gaps')
    .insert({
      title,
      query_text: title,
      description,
      user_id: user.id,
      source_type: 'user_post',
      status: 'open',
      mode: 'scholarly_consensus',
      era: classification.era,
      geography: classification.geography,
      subject: classification.subject,
    })
    .select('id')
    .single();

  if (error || !newGap) {
    console.error('[gapActions] Error creating request:', error);
    return { success: false, error: error?.message || 'Failed to post request.' };
  }

  revalidatePath('/explore');
  return { success: true, gapId: newGap.id };
}

export async function toggleUpvoteAction(gapId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to upvote.' };
  }

  // Check if user already upvoted
  const { data: existing } = await supabase
    .from('archive_gap_upvotes')
    .select('gap_id')
    .eq('gap_id', gapId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    // Remove upvote
    const { error } = await supabase
      .from('archive_gap_upvotes')
      .delete()
      .eq('gap_id', gapId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/explore');
    return { success: true, upvoted: false };
  } else {
    // Add upvote
    const { error } = await supabase
      .from('archive_gap_upvotes')
      .insert({ gap_id: gapId, user_id: user.id });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/explore');
    return { success: true, upvoted: true };
  }
}

export async function addCommentAction(gapId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'You must be signed in to comment.' };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { success: false, error: 'Comment cannot be empty.' };
  }

  const { data: newComment, error } = await supabase
    .from('archive_gap_comments')
    .insert({
      gap_id: gapId,
      user_id: user.id,
      content: trimmed,
    })
    .select('id, content, created_at, user_id')
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/explore');
  return { success: true, comment: newComment };
}

export async function fetchCommentsAction(gapId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('archive_gap_comments')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles!archive_gap_comments_user_id_fkey(username, display_name, avatar_url, role)
    `)
    .eq('gap_id', gapId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[gapActions] Error fetching comments:', error);
    return { success: false, comments: [] };
  }

  return { success: true, comments: data || [] };
}

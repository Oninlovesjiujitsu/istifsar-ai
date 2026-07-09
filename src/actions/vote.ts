'use server';

import { createClient } from '@/src/lib/supabase/server';

export async function toggleVote(
  targetType: string,
  targetId: string,
): Promise<{ voted: boolean; count: number }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Not authenticated.');
  }

  // Check if already voted
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle();

  if (existing) {
    // Remove vote
    await supabase.from('votes').delete().eq('id', existing.id);
  } else {
    // Add vote
    await supabase.from('votes').insert({
      user_id: user.id,
      target_type: targetType,
      target_id: targetId,
      value: 1,
    });
  }

  // Get updated count
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('target_type', targetType)
    .eq('target_id', targetId);

  return {
    voted: !existing,
    count: count ?? 0,
  };
}

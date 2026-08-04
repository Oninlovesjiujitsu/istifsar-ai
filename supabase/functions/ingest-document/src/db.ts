import { createClient } from 'npm:@supabase/supabase-js@2';

export function createDbClient(url: string, key: string) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function setStatus(
  db: ReturnType<typeof createClient>,
  docId: string,
  status: 'processing' | 'done' | 'failed',
  errorMsg?: string,
  submitterId?: string,
  currentStatus?: string,
) {
  console.log(`[ingest-document] setStatus called: docId=${docId}, status=${status}, submitterId=${submitterId}, currentStatus=${currentStatus}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {
    ingestion_status: status,
    ingestion_error: errorMsg ?? null,
  };

  if (status === 'done' && submitterId && currentStatus === 'under_review') {
    try {
      const { data: profile, error: profErr } = await db
        .from('profiles')
        .select('role')
        .eq('id', submitterId)
        .single();

      if (profErr) {
        console.error('[ingest-document] profiles fetch error:', profErr);
      } else {
        console.log(`[ingest-document] fetched profile role for ${submitterId}:`, profile?.role);
        const isVerified = profile?.role === 'verified_historian' || profile?.role === 'admin';
        if (isVerified) {
          updatePayload.status = 'published';
          updatePayload.published_at = new Date().toISOString();
          console.log(`[ingest-document] Auto-publishing document ${docId}`);
        } else {
          console.log(`[ingest-document] Submitter is not verified (role: ${profile?.role}), keeping under_review`);
        }
      }
    } catch (err) {
      console.error('[ingest-document] Failed to check submitter role for auto-publish:', err);
    }
  }

  console.log(`[ingest-document] Updating document ${docId} with payload:`, updatePayload);
  const { error: updateErr } = await db
    .from('documents')
    .update(updatePayload)
    .eq('id', docId);

  if (updateErr) {
    console.error(`[ingest-document] Failed to update documents table:`, updateErr.message);
  } else {
    console.log(`[ingest-document] Successfully updated document status`);
  }
}

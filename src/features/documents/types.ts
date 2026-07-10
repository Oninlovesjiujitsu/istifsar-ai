
/**
 * Ingestion-related types that extend the auto-generated database.ts.
 * The columns added in migration 0006 (transcription_path, ingestion_status,
 * ingestion_error) won't appear in database.ts until types are regenerated.
 * Use these types in the Server Action and Edge Function in the meantime.
 *
 * After running: npx supabase gen types typescript --local > types/database.ts
 * these augmentations can be removed.
 */

import type { Database } from '@/src/types/database';

/** documents row with migration-0006 columns included. */
export type DocumentRow =
  Database['public']['Tables']['documents']['Row'] & {
    transcription_path: string | null;
    ingestion_status: 'queued' | 'processing' | 'done' | 'failed';
    ingestion_error: string | null;
  };

/** documents insert payload with migration-0006 columns included. */
export type DocumentInsert =
  Database['public']['Tables']['documents']['Insert'] & {
    transcription_path?: string | null;
    ingestion_status?: 'queued' | 'processing' | 'done' | 'failed';
  };

/** Webhook payload shape sent to the ingest-document Edge Function. */
export type DocumentInsertWebhookPayload = {
  type: 'INSERT';
  table: 'documents';
  record: DocumentRow;
};

/** Result type for the uploadDocument Server Action. */
export type UploadDocumentResult =
  | { success: true; documentId: string }
  | { success: false; error: string };

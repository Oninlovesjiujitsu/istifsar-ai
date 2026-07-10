import { authGuard } from '@/src/lib/supabase/authGuard';
import { createClient } from '@/src/lib/supabase/server';
import ValidateView from '@/src/features/contribute/components/ValidateView';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: doc } = await supabase
    .from('documents')
    .select('title')
    .eq('id', id)
    .single();

  return {
    title: doc?.title ? `Review: ${doc.title} — Istifsar` : 'Review document — Istifsar',
  };
}

export default async function ValidateDocumentPage({ params }: Props) {
  await authGuard({ requireAuth: true, minRole: 'verified_historian' });

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { id } = await params;

  const { data: doc } = await supabase
    .from('documents')
    .select(
      `
      id, title, description, document_type, date_of_origin, origin_location, language,
      storage_path, mime_type, submitter_id, status,
      document_validations (
        decision, notes,
        validator_id,
        profiles!validator_id ( display_name )
      )
    `,
    )
    .eq('id', id)
    .single();

  // Redirect if doc not found or if the current user is the submitter
  if (!doc || doc.submitter_id === user!.id) {
    redirect('/review');
  }

  // Get signed URL for the document scan
  let scanUrl: string | null = null;
  if (doc.storage_path) {
    const { data: signedData } = await supabase.storage
      .from('document-scans')
      .createSignedUrl(doc.storage_path, 3600);
    scanUrl = signedData?.signedUrl ?? null;
  }

  // Get transcription text if available
  // transcription_path is added by migration 0006 and not yet in generated types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transcriptionPath = (doc as any).transcription_path as string | null;
  let transcriptionText: string | null = null;
  if (transcriptionPath) {
    const { data: blob } = await supabase.storage
      .from('transcriptions')
      .download(transcriptionPath);
    transcriptionText = blob ? await blob.text() : null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawValidations = (doc as any).document_validations as Array<{
    decision: string;
    notes: string | null;
    validator_id: string;
    profiles: { display_name: string } | null;
  }>;

  const existingValidation =
    rawValidations.find((v) => v.validator_id === user!.id)
      ? {
        decision: rawValidations.find((v) => v.validator_id === user!.id)!.decision,
        notes: rawValidations.find((v) => v.validator_id === user!.id)!.notes,
      }
      : null;

  // All other validators' decisions (excluding current user)
  const otherValidations = rawValidations
    .filter((v) => v.validator_id !== user!.id)
    .map((v) => ({
      validatorName: v.profiles?.display_name ?? 'Validator',
      decision: v.decision,
      notes: v.notes,
    }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <ValidateView
        documentId={doc.id}
        title={doc.title}
        description={doc.description ?? null}
        documentType={doc.document_type ?? null}
        dateOfOrigin={doc.date_of_origin ?? null}
        originLocation={doc.origin_location ?? null}
        language={doc.language ?? null}
        mimeType={doc.mime_type ?? null}
        scanUrl={scanUrl}
        transcriptionText={transcriptionText}
        existingValidation={existingValidation}
        validations={otherValidations}
      />
    </div>
  );
}

import { proxy } from '@/proxy';
import { createClient } from '@/lib/supabase/server';
import ValidateList from '@/components/contribute/ValidateList';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Validation queue — Istifsar',
};

export default async function ValidateQueuePage() {
  await proxy({ requireAuth: true, minRole: 'verified_historian' });

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // user is guaranteed non-null after proxy requireAuth
  const { data: documents } = await supabase
    .from('documents')
    .select(
      `
      id, title, document_type, date_of_origin, created_at, status,
      profiles!submitter_id ( display_name ),
      document_validations ( decision, validator_id )
    `,
    )
    .in('status', ['pending', 'under_review'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .neq('submitter_id', (user as any)!.id)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold">Validation queue</h1>
        <p className="text-muted-foreground">
          Review submitted primary sources.
        </p>
      </div>

      <ValidateList
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        documents={(documents as any) ?? []}
        userId={user!.id}
      />
    </div>
  );
}


import { authGuard } from '@/src/lib/supabase/authGuard';
import UploadForm from '@/src/features/contribute/components/UploadForm';

export const metadata = {
  title: 'Add a primary source — Istifsar',
};

export default async function UploadPage() {
  await authGuard({ requireAuth: true, minRole: 'verified_historian' });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Add a verified and authenticated source
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Upload your writings as a historian.
        </p>
      </div>

      <UploadForm />
    </main>
  );
}

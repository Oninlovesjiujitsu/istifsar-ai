
import { proxy } from '@/proxy';
import UploadForm from '@/components/contribute/UploadForm';

export const metadata = {
  title: 'Add a primary source — Istifsar',
};

export default async function UploadPage() {
  await proxy({ requireAuth: true, minTier: 'tier_3' });

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Add a primary source
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Upload a scan of a historical document. Every source is reviewed by
          historians before it becomes searchable on the platform.
        </p>
      </div>

      <UploadForm />
    </main>
  );
}

import { authGuard } from '@/src/lib/supabase/authGuard';
import UploadForm from '@/src/features/contribute/components/UploadForm';

export const metadata = {
  title: 'Add a primary source — Istifsar',
};

export default async function UploadPage() {
  await authGuard({ requireAuth: true, minRole: 'verified_historian' });

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8 xl:p-12 relative">
      {/* Breadcrumb */}
      <nav className="max-w-6xl mx-auto mb-6 text-sm text-muted-foreground flex items-center gap-2">
        <span className="text-muted-foreground">Workspace</span>
        <span>/</span>
        <span className="text-primary font-medium">Contribute Source</span>
      </nav>

      <header className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.4em] text-primary">
          Archival Ledger
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading text-foreground leading-tight max-w-2xl mt-3 sm:mt-4">
          Add a verified source
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl text-sm leading-relaxed">
          Upload primary sources and documents. The ingestion pipeline will extract text, build embeddings, and automatically look for historiographical contentions.
        </p>
        <div className="h-px w-24 bg-gradient-to-r from-border to-transparent mt-6" />
      </header>

      <div className="max-w-4xl mx-auto">
        <UploadForm />
      </div>
    </div>
  );
}

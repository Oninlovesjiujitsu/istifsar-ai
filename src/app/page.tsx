import dynamic from 'next/dynamic';
import LandingNavbar from '@/src/components/layout/LandingNavbar';
import ArchiveBookshelfSilhouette from '@/src/components/layout/ArchiveBookshelfSilhouette';
import FloatingBackToTop from '@/src/components/layout/FloatingBackToTheTop';
import LandingPageAuthRedirect from '@/src/components/layout/LandingPageAuthRedirect';
import FooterWithContact from '@/src/features/landing/components/FooterWithContact';

// Above-the-fold components (load synchronously)
import HeroSection from '@/src/features/landing/components/HeroSection';

// Below-the-fold components (lazy load to improve hydration and LCP)
const PlatformPillarsSection = dynamic(() => import('@/src/features/landing/components/PlatformPillarsSection'));
const GraphRAGArchitectureSection = dynamic(() => import('@/src/features/landing/components/GraphRAGArchitectureSection'));
const PersonaSection = dynamic(() => import('@/src/features/landing/components/PersonaSection'));
const AgoncilloSection = dynamic(() => import('@/src/features/landing/components/AgoncilloSection'));
const BoundariesSection = dynamic(() => import('@/src/features/landing/components/BoundariesSection'));
const HistoriansSection = dynamic(() => import('@/src/features/landing/components/HistoriansSection'));
const ArchiveCatalog = dynamic(() => import('@/src/features/archive/components/ArchiveCatalog'));

export default function LandingPage() {
  return (
    <div>
      <LandingPageAuthRedirect />
      <ArchiveBookshelfSilhouette />
      <LandingNavbar />

      <main>
        <HeroSection />
        <PlatformPillarsSection />
        <GraphRAGArchitectureSection />
        <AgoncilloSection />
        <PersonaSection />
        <ArchiveCatalog />
        <BoundariesSection />
        <HistoriansSection />
      </main>

      <FooterWithContact />
      <FloatingBackToTop />
    </div>
  );
}

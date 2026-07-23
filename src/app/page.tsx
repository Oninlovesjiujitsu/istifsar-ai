'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import LandingNavbar from '@/src/components/layout/LandingNavbar';
import ContactModal from '@/src/features/contact/components/ContactModal';
import ArchiveCatalog from '@/src/features/archive/components/ArchiveCatalog';
import FireFlyBackground from '@/src/components/layout/FireFlyBackground';
import ArchiveBookshelfSilhouette from '@/src/components/layout/ArchiveBookshelfSilhouette';
import FloatingBackToTop from '@/src/components/layout/FloatingBackToTheTop';

// Landing Feature Components
import HeroSection from '@/src/features/landing/components/HeroSection';
import ArchivalStatsBanner from '@/src/features/landing/components/ArchivalStatsBanner';
import PlatformPillarsSection from '@/src/features/landing/components/PlatformPillarsSection';
import GraphRAGArchitectureSection from '@/src/features/landing/components/GraphRAGArchitectureSection';
import PersonaSection from '@/src/features/landing/components/PersonaSection';
import AgoncilloSection from '@/src/features/landing/components/AgoncilloSection';
import BoundariesSection from '@/src/features/landing/components/BoundariesSection';
import HistoriansSection from '@/src/features/landing/components/HistoriansSection';
import LandingFooter from '@/src/features/landing/components/LandingFooter';

export default function LandingPage() {
  const [contactOpen, setContactOpen] = useState(false);

  const { role, loading } = useAuth();
  const router = useRouter();

  // Silent session validation redirect
  useEffect(() => {
    if (!loading && role) {
      if (role === 'admin') {
        router.replace('/admin');
      } else if (role === 'verified_historian') {
        router.replace('/dashboard');
      } else {
        router.replace('/explore');
      }
    }
  }, [role, loading, router]);

  return (
    <div>
      <ArchiveBookshelfSilhouette />
      <LandingNavbar />

      <main>
        <HeroSection />
        <ArchivalStatsBanner />
        <PlatformPillarsSection />
        <GraphRAGArchitectureSection />
        <AgoncilloSection />
        <PersonaSection />
        <ArchiveCatalog />
        <BoundariesSection />
        <HistoriansSection />
      </main>

      <LandingFooter onContactClick={() => setContactOpen(true)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <FloatingBackToTop />
    </div>
  );
}

'use client';

import { useState } from 'react';
import LandingFooter from '@/src/features/landing/components/LandingFooter';
import ContactModal from '@/src/features/contact/components/ContactModal';

export default function FooterWithContact() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <>
      <LandingFooter onContactClickAction={() => setContactOpen(true)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}

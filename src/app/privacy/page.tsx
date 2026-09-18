'use client';

import { useState } from 'react';
import LandingNavbar from '@/src/components/layout/LandingNavbar';
import LandingFooter from '@/src/features/landing/components/LandingFooter';
import ContactModal from '@/src/features/contact/components/ContactModal';
import FloatingBackToTop from '@/src/components/layout/FloatingBackToTheTop';
import ArchiveBookshelfSilhouette from '@/src/components/layout/ArchiveBookshelfSilhouette';


export default function PrivacyPolicyPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative">
      <ArchiveBookshelfSilhouette />
      <LandingNavbar />

      {/* Main Content Container */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-12 sm:pb-16 relative z-10 w-full">
        <div className="mb-10 sm:mb-14">
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground font-bold tracking-tight mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground font-serif">
            Last updated: July 2026
          </p>
        </div>

        <div className="prose prose-sm sm:prose-base dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary hover:prose-a:text-primary/80 prose-strong:text-foreground prose-ul:text-muted-foreground max-w-none font-serif">
          
          <p>
            Istifsar AI exists to connect curious minds and scholars with verified historical literature while minimizing ungrounded AI speculation. We believe that historical research requires uncompromising privacy, transparent source attribution, and strict protection against commercial data harvesting or historical distortion.
          </p>

          <h3>1. Introduction & Ethical Commitment</h3>
          <p>
            Istifsar AI (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; or &ldquo;our&rdquo;) is built upon <strong>The Agoncillo Principle</strong>: strict reliance on the documented writings, publications, and archival records of trustworthy historians. In fulfilling this mission, we extend the same rigorous standards of integrity to your privacy. This policy outlines how we handle user data, protect research inquiries, and ensure zero commercial monetization of historical inquiry.
          </p>

          <h3>2. Information We Collect & How It Is Used</h3>
          <p>
            We collect minimal data necessary to facilitate scholarly exploration, manage role-based access control, and maintain archival records:
          </p>
          <ul>
            <li><strong>User Credentials & Profiles:</strong> When you register as a History Reader, or Verified Historian, we store your email address, username, display name, role permissions, and scholarly preferences using Supabase authentication services.</li>
            <li><strong>Research Vault & Query Logs:</strong> Queries and research prompts submitted to the Agoncillo Engine are processed to generate source-anchored answers. Conversations are saved to your personal Conversation Vault for ongoing research.</li>
          </ul>

          <h3>3. AI Processing Transparency & Third-Party Safeguards</h3>
          <p>
            To synthesize responses grounded in indexed historian literature, your search queries (along with retrieved snippets of verified primary and secondary texts) are transmitted to the Google Generative AI (Gemini API).
          </p>
          <p><strong>Enterprise Privacy Guarantee:</strong></p>
          <ul>
            <li>Your queries are sent under developer enterprise terms and are <strong>never used to train public foundation models</strong>.</li>
            <li>We strip all personally identifiable information (email, real names, user IDs) before processing queries with AI services.</li>
            <li>Outputs are strictly constrained by retrieval context to prevent speculative AI hallucination.</li>
          </ul>

          <h3>4. Archival Integrity & Source Attribution</h3>
          <p>
            Istifsar AI honors intellectual property and academic stewardship. Works uploaded by Verified Historians, primary manuscript transcriptions, and secondary literature citations remain strictly attributed to their respective authors, books, and archive tags.
          </p>
          <p>
            Research gap requests and community bounties submitted on the platform serve an open scholarly purpose: helping historians identify under-documented historical eras and expand the verified digital library.
          </p>

          <h3>5. User Autonomy & Vault Data Control</h3>
          <p>
            You retain complete ownership over your research journey. You have the right to:
          </p>
          <ul>
            <li><strong>Clear Vault History:</strong> Delete individual conversation streams or clear your research history in Account Settings.</li>
            <li><strong>Account Erasure & Termination:</strong> Request full account erasure, which permanently removes your personal profile credentials and user records from our servers.</li>
          </ul>

          <h3>6. Philippine Data Privacy Act Compliance (R.A. 10173)</h3>
          <p>
            Republic Act No. 10173, known as the Data Privacy Act of 2012, protects the privacy rights of individuals while regulating the processing of personal information in the Philippines. It enforces a standardized approach to data protection across government and private sectors and is overseen by the National Privacy Commission.
          </p>
          <p>
            Istifsar AI strictly adheres to the principles of transparency, legitimate purpose, and proportionality mandated under Republic Act No. 10173 in all personal data processing activities.
          </p>

          <h3>7. Contact & Curatorial Inquiries</h3>
          <p>
            For questions regarding our privacy standards, data autonomy, or to exercise your rights under the Data Privacy Act of 2012 (R.A. 10173), please contact our curatorial team through the Contact modal in the platform footer.
          </p>
        </div>
      </main>

      <LandingFooter onContactClickAction={() => setContactOpen(true)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <FloatingBackToTop />
    </div>
  );
}

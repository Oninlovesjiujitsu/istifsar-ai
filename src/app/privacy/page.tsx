'use client';

import { useState } from 'react';
import LandingNavbar from '@/src/components/layout/LandingNavbar';
import LandingFooter from '@/src/features/landing/components/LandingFooter';
import ContactModal from '@/src/features/contact/components/ContactModal';

export default function PrivacyPolicyPage() {
  const [contactOpen, setContactOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-serif">
      <LandingNavbar />

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-12 md:pt-32 md:pb-20">
        <h1 className="font-heading text-4xl sm:text-5xl text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-xs uppercase tracking-[0.2em] text-gold mb-10 font-sans">
          Last Updated: July 11, 2026
        </p>

        <div className="space-y-10 leading-relaxed text-text-muted-vault text-sm sm:text-base font-serif">
          <section>
            <h2 className="font-heading text-xl sm:text-2xl text-foreground mb-4 italic">
              1. Introduction & Mission
            </h2>
            <p>
              Istifsar AI ("we," "our," or "the Platform") is dedicated to providing verified, citation-anchored access to historical scholarship. In doing so, we are committed to respecting your privacy. This Privacy Policy details how we handle information collected from our users—including researchers, historians, and guests—and how we ensure your data is processed ethically.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl sm:text-2xl text-foreground mb-4 italic">
              2. Information We Collect
            </h2>
            <p className="mb-4">
              To provide our retrieval and curation services, we collect two primary forms of information:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Account Information</strong>: When you register as an authorized Historian or Researcher, we collect your email address, username, display name, and password hashes using Supabase authentication services.
              </li>
              <li>
                <strong className="text-foreground">Research Queries & Interactions</strong>: We temporarily process and index the queries, source uploads, and prompts you input to retrieve historical citations. These interactions are stored to maintain your Conversation Vault history.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl sm:text-2xl text-foreground mb-4 italic">
              3. Artificial Intelligence & Third-Party Processing
            </h2>
            <p className="mb-4">
              Our core feature uses Retrieval-Augmented Generation (RAG) to generate responses based on historical writings.
            </p>
            <p>
              To synthesize responses, your research queries (along with retrieved snippets of relevant historical literature) are shared with the <strong className="text-foreground">Google Generative AI (Gemini API)</strong>. Prompts sent through developer APIs are governed under enterprise developer terms and are not utilized to train generic base models. We do not transmit personally identifiable information (such as your email or display name) to the Generative AI service.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl sm:text-2xl text-foreground mb-4 italic">
              4. Service Providers & Storage
            </h2>
            <p className="mb-4">
              We leverage reliable partners to maintain database integrity and application performance:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Supabase</strong>: Used for hosting databases, application schema metadata, and secure user identity management.
              </li>
              <li>
                <strong className="text-foreground">Upstash Redis</strong>: Used for caching semantic search queries and rate limiting to protect platform availability.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl sm:text-2xl text-foreground mb-4 italic">
              5. User Rights & Data Deletion
            </h2>
            <p className="mb-4">
              We believe in user autonomy and full control over historical curation portfolios:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Deletion</strong>: You can request the deletion of your account and related Conversation Vault history at any time by contacting platform curators.
              </li>
              <li>
                <strong className="text-foreground">Export</strong>: If you need a copy of your uploaded documents or publications, we provide tools in the Dashboard to export your metadata.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl sm:text-2xl text-foreground mb-4 italic">
              6. Contact Details
            </h2>
            <p>
              If you have any questions or concern regarding this policy, or if you wish to exercise your rights under GDPR or local privacy rules, please use the Contact modal in our archive footer to reach out to the curation team.
            </p>
          </section>
        </div>
      </main>
      <LandingFooter onContactClick={() => setContactOpen(true)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
}

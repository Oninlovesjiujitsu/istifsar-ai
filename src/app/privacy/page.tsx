'use client';

import { useState } from 'react';
import LandingNavbar from '@/src/components/layout/LandingNavbar';
import LandingFooter from '@/src/features/landing/components/LandingFooter';
import ContactModal from '@/src/features/contact/components/ContactModal';
import FloatingBackToTop from '@/src/components/layout/FloatingBackToTheTop';
import ArchiveBookshelfSilhouette from '@/src/components/layout/ArchiveBookshelfSilhouette';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Shield01Icon,
  BookOpen02Icon,
  DatabaseIcon,
  LockIcon,
  HelpCircleIcon,
} from '@hugeicons/core-free-icons';

export default function PrivacyPolicyPage() {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative">
      <ArchiveBookshelfSilhouette />
      <LandingNavbar />

      {/* Main Content Container */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 md:px-12 pt-20 sm:pt-28 md:pt-36 pb-12 sm:pb-16 md:pb-24 relative z-10 w-full">
        {/* Header */}
        <div className="mb-8 sm:mb-12 border-b border-border/60 pb-6 sm:pb-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full mb-3 sm:mb-4 max-w-full">
            <HugeiconsIcon icon={Shield01Icon} size={14} className="shrink-0" />
            <span className="truncate">Ethical Standards &amp; Privacy Advocacy</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl text-primary tracking-tight mb-3 sm:mb-4 font-bold leading-tight">
            Privacy Policy &amp; Epistemic Advocacy
          </h1>

          <p className="text-[10px] sm:text-xs font-mono uppercase tracking-wider text-muted-foreground leading-normal">
            Effective Date: July 2026 | Dedicated to Archival Integrity &amp; Scholarly Trust
          </p>
        </div>

        {/* Core Advocacy Callout Box */}
        <div className="p-5 sm:p-7 md:p-8 rounded-lg bg-surface-vault border border-primary/30 mb-8 sm:mb-12 shadow-sm parchment-texture">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3 text-primary">
            <HugeiconsIcon icon={BookOpen02Icon} size={20} className="shrink-0" />
            <h2 className="font-heading text-base sm:text-lg md:text-xl font-bold text-foreground leading-snug">
              Our Core Advocacy: Preserving Truth Through Trustworthy Literature
            </h2>
          </div>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed font-serif">
            Istifsar AI exists to connect curious minds and scholars with verified historical literature while minimizing ungrounded AI speculation. We believe that historical research requires uncompromising privacy, transparent source attribution, and strict protection against commercial data harvesting or historical distortion.
          </p>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-8 sm:space-y-12 leading-relaxed text-foreground/90 font-serif">
          {/* Section 1 */}
          <section className="space-y-2.5 sm:space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">01</span>
              <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-foreground font-semibold">
                Introduction &amp; Ethical Commitment
              </h2>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              Istifsar AI (&ldquo;the Platform,&rdquo; &ldquo;we,&rdquo; or &ldquo;our&rdquo;) is built upon <strong>The Agoncillo Principle</strong>: strict reliance on the documented writings, publications, and archival records of trustworthy historians. In fulfilling this mission, we extend the same rigorous standards of integrity to your privacy. This policy outlines how we handle user data, protect research inquiries, and ensure zero commercial monetization of historical inquiry.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">02</span>
              <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-foreground font-semibold">
                Information We Collect &amp; How It Is Used
              </h2>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              We collect minimal data necessary to facilitate scholarly exploration, manage role-based access control, and maintain archival records:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
              <div className="p-3.5 sm:p-4 rounded-md bg-card border border-border/60">
                <div className="flex items-center gap-2 text-primary font-heading font-semibold text-xs sm:text-sm mb-1">
                  <HugeiconsIcon icon={LockIcon} size={15} className="shrink-0" />
                  User Credentials &amp; Profiles
                </div>
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-normal font-sans">
                  When you register as a History Reader, or Verified Historian, we store your email address, username, display name, role permissions, and scholarly preferences using Supabase authentication services.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-md bg-card border border-border/60">
                <div className="flex items-center gap-2 text-primary font-heading font-semibold text-xs sm:text-sm mb-1">
                  <HugeiconsIcon icon={DatabaseIcon} size={15} className="shrink-0" />
                  Research Vault &amp; Query Logs
                </div>
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground leading-normal font-sans">
                  Queries and research prompts submitted to the Agoncillo Engine are processed to generate source-anchored answers. Conversations are saved to your personal <strong>Conversation Vault</strong> for ongoing research.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">03</span>
              <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-foreground font-semibold">
                AI Processing Transparency &amp; Third-Party Safeguards
              </h2>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              To synthesize responses grounded in indexed historian literature, your search queries (along with retrieved snippets of verified primary and secondary texts) are transmitted to the <strong>Google Generative AI (Gemini API)</strong>.
            </p>

            <div className="p-3.5 sm:p-4 rounded-md bg-muted/40 border border-border/50 text-xs sm:text-sm font-sans space-y-2">
              <div className="font-semibold text-foreground flex items-center gap-2 text-xs sm:text-sm">
                <HugeiconsIcon icon={Shield01Icon} size={15} className="text-primary shrink-0" />
                Enterprise Privacy Guarantee:
              </div>
              <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-muted-foreground text-[11px] sm:text-xs md:text-sm leading-relaxed">
                <li>Your queries are sent under developer enterprise terms and are <strong>never used to train public foundation models</strong>.</li>
                <li>We strip all personally identifiable information (email, real names, user IDs) before processing queries with AI services.</li>
                <li>Outputs are strictly constrained by retrieval context to prevent speculative AI hallucination.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">04</span>
              <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-foreground font-semibold">
                Archival Integrity &amp; Source Attribution
              </h2>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              Istifsar AI honors intellectual property and academic stewardship. Works uploaded by Verified Historians, primary manuscript transcriptions, and secondary literature citations remain strictly attributed to their respective authors, books, and archive tags.
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              Research gap requests and community bounties submitted on the platform serve an open scholarly purpose: helping historians identify under-documented historical eras and expand the verified digital library.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">05</span>
              <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-foreground font-semibold">
                User Autonomy &amp; Vault Data Control
              </h2>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              You retain complete ownership over your research journey. You have the right to:
            </p>

            <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              <li><strong>Clear Vault History</strong>: Delete individual conversation streams or clear your research history in Account Settings.</li>
              <li><strong>Account Erasure &amp; Termination</strong>: Request full account erasure, which permanently removes your personal profile credentials and user records from our servers.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <span className="font-mono text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">06</span>
              <h2 className="font-heading text-lg sm:text-xl md:text-2xl text-foreground font-semibold">
                Philippine Data Privacy Act Compliance (R.A. 10173)
              </h2>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              Republic Act No. 10173, known as the Data Privacy Act of 2012, protects the privacy rights of individuals while regulating the processing of personal information in the Philippines. It enforces a standardized approach to data protection across government and private sectors and is overseen by the National Privacy Commission.
            </p>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              Istifsar AI strictly adheres to the principles of transparency, legitimate purpose, and proportionality mandated under Republic Act No. 10173 in all personal data processing activities.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-2.5 sm:space-y-3 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2 text-primary">
              <HugeiconsIcon icon={HelpCircleIcon} size={18} className="shrink-0" />
              <h2 className="font-heading text-base sm:text-lg md:text-xl text-foreground font-semibold">
                Contact &amp; Curatorial Inquiries
              </h2>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
              For questions regarding our privacy standards, data autonomy, or to exercise your rights under the Data Privacy Act of 2012 (R.A. 10173), please contact our curatorial team through the Contact modal in the platform footer.
            </p>
          </section>
        </div>
      </main>

      <LandingFooter onContactClick={() => setContactOpen(true)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <FloatingBackToTop />
    </div>
  );
}

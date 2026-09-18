'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';
import { QuillWrite01Icon } from '@hugeicons/core-free-icons';

export default function LandingFooter({
  onContactClickAction,
}: {
  onContactClickAction: () => void;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="w-full relative z-20 bg-background border-t border-border overflow-hidden"
    >
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
      
      <div className="w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 pt-20 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-5 flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-3 group mb-5">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)]">
                <HugeiconsIcon icon={QuillWrite01Icon} size={24} />
              </div>
              <span className="text-2xl font-serif italic text-foreground tracking-widest group-hover:text-primary transition-colors duration-300">
                Istifsar AI
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-6 font-medium">
              The Digital Curator. Preserving Philippine history through advanced GraphRAG architecture and ethical AI verification.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/Oninlovesjiujitsu/istifsar-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full bg-muted/30 border border-border/50 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm"
                aria-label="GitHub Repository"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-3 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-foreground mb-6">Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/explore" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Explore Archive
                </Link>
              </li>
              <li>
                <a href="/#pillars" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Capabilities
                </a>
              </li>
              <li>
                <a href="/#agoncillo" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Agoncillo Principle
                </a>
              </li>
              <li>
                <a href="/#personas" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Ecosystem
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-foreground mb-6">Legal</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Terms of Service
                </Link>
              </li>
              <li>
                <a href="/#boundaries" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Ethical Limits
                </a>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left">
            <h3 className="text-sm font-semibold tracking-widest uppercase text-foreground mb-6">Connect</h3>
            <ul className="space-y-4">
              <li>
                <button
                  type="button"
                  onClick={onContactClickAction}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Join as Historian
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs tracking-widest uppercase text-muted-foreground text-center md:text-left font-medium">
            &copy; {currentYear} Istifsar AI. All rights reserved.
          </p>
          
          <p className="text-xs tracking-widest uppercase text-muted-foreground/80 text-center flex items-center gap-2">
            Built by
            <a
              href="https://onin-portfolio.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-primary font-bold transition-all inline-flex items-center px-2 py-1 overflow-hidden rounded-md"
            >
              <span className="relative z-10 group-hover:text-primary-foreground transition-colors duration-300">Niño Olvis</span>
              <span className="absolute inset-0 bg-primary rounded-md transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 ease-out z-0"></span>
            </a>
          </p>
        </div>
      </div>
    </motion.footer>
  );
}

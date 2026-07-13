'use client';

import { motion } from 'motion/react';

export default function LandingFooter({
  onContactClick,
}: {
  onContactClick: () => void;
}) {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="w-full border-t border-border relative z-20 bg-background"
    >
      <div className="flex flex-col md:flex-row justify-between items-center px-4 sm:px-6 md:px-16 py-6 md:py-8 w-full max-w-[1440px] mx-auto gap-6 md:gap-8">
        <p className="text-xs sm:text-sm tracking-widest uppercase text-muted-foreground text-center md:text-left">
          &copy; 2026 Istifsar AI. All rights reserved. The Digital Curator.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-12">
          <a
            href="#"
            className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase text-muted-foreground hover:text-primary transition-all opacity-80 hover:opacity-100"
          >
            Privacy Policy
          </a>
          <button
            type="button"
            onClick={onContactClick}
            className="text-xs sm:text-sm tracking-wider sm:tracking-widest uppercase text-muted-foreground hover:text-primary transition-all opacity-80 hover:opacity-100 cursor-pointer"
          >
            Contact
          </button>
          <a
            href="https://github.com/Oninlovesjiujitsu/istifsar-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-all opacity-80 hover:opacity-100"
            aria-label="GitHub Repository"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>
      </div>
    </motion.footer>
  );
}

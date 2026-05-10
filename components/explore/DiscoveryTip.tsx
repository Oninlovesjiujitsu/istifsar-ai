import Link from 'next/link';

export default function DiscoveryTip() {
  return (
    <div className="bg-white/[0.02] p-10 lg:p-12 rounded-sm border border-white/5 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row gap-10 items-center">
        <div className="flex-1">
  <span className="inline-block text-xs uppercase tracking-[0.2em] text-gold mb-5">
    The Librarian&apos;s Tip
  </span>
  
  {/* Added mb-10 lg:mb-12 here to create that massive, even gap you want */}
  <blockquote className="text-2xl lg:text-3xl font-heading italic text-foreground leading-snug mb-10 lg:mb-12">
    &ldquo;History is a set of lies agreed upon — unless you find the primary
    sources.&rdquo;
  </blockquote>
  
  <p className="text-text-muted-vault text-sm leading-relaxed max-w-lg mb-6">
    Start a new inquiry to explore the archive. Every answer is drawn from
    verified scholarly sources — if the archive doesn&apos;t have it,
    we&apos;ll say so honestly.
  </p>
  
  <Link
    href="/documents"
    className="inline-flex items-center gap-3 text-gold hover:text-foreground transition-colors uppercase text-xs tracking-widest font-bold group"
  >
    Browse the collection
    <span className="block w-10 h-px bg-gold group-hover:w-14 transition-all duration-300" />
  </Link>
</div>

        {/* Decorative element */}
        <div className="shrink-0 w-40 h-40 border border-gold/30 p-4 relative group hidden md:block">
          <div className="absolute inset-0 border border-gold/10 translate-x-3 translate-y-3 -z-10 group-hover:translate-x-5 group-hover:translate-y-5 transition-transform duration-500" />
          <div className="w-full h-full bg-surface-vault flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gold/20"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={0.75}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

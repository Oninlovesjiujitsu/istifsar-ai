import Link from 'next/link';

type ArchiveCardProps = {
  href: string;
  title: string;
  description: string;
  stat: string;
};

export default function ArchiveCard({ href, title, description, stat }: ArchiveCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-surface-elevated p-8 rounded-sm border border-border dark:border-l dark:border-t dark:border-white/5 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] dark:hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] hover:shadow-lg hover:-translate-y-1 overflow-hidden"
    >
      {/* Gold glow on hover (dark only) */}
      <div className="absolute -inset-px bg-gold opacity-0 dark:group-hover:opacity-[0.15] transition-opacity duration-500 -z-10 blur-sm" />

      <div className="flex flex-col h-full gap-6">
        {/* Icon placeholder */}
        <div className="aspect-[4/3] w-full overflow-hidden bg-muted dark:bg-[#0e0e0e] rounded-sm relative flex items-center justify-center">
          <svg
            className="w-16 h-16 text-muted-foreground/30 dark:text-gold/20 group-hover:text-gold/60 dark:group-hover:text-gold/40 transition-colors duration-500"
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
          <div className="absolute inset-0 bg-gradient-to-t from-muted dark:from-surface-elevated via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xl font-heading text-foreground group-hover:text-primary dark:group-hover:text-gold transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground dark:text-text-muted-vault leading-relaxed line-clamp-3">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-5 border-t border-border dark:border-white/5">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground dark:text-text-muted-vault">
            {stat}
          </span>
          <svg
            className="w-5 h-5 text-gold opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

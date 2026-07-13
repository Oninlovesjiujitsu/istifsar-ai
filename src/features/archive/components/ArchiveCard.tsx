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
      className="group relative rounded-sm border-t border-l md:border-t-[1.5px] md:border-l-[1.5px] border-b-2 border-r-2 border-t-white border-l-white border-b-foreground/15 border-r-foreground/15 bg-card p-4 md:p-5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.01] hover:border-primary/45 flex flex-row md:flex-col gap-4 md:gap-5 overflow-hidden h-full items-stretch shadow-[2px_2px_0px_0px_hsl(var(--card)),_2px_2px_0px_1px_hsl(var(--border)),_4px_4px_0px_0px_hsl(var(--card)),_4px_4px_0px_1px_hsl(var(--border))] hover:shadow-[3px_3px_0px_0px_hsl(var(--card)),_3px_3px_0px_1px_hsl(var(--border)),_6px_6px_0px_0px_hsl(var(--card)),_6px_6px_0px_1px_hsl(var(--border)),_0_10px_15px_-3px_rgba(0,0,0,0.1)]"
    >
      {/* Subtle border glow on hover */}
      <div className="absolute -inset-px bg-primary opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 -z-10 blur-sm" />

      {/* Icon placeholder */}
      <div className="w-16 h-16 md:w-full md:h-auto md:aspect-[4/3] overflow-hidden bg-muted rounded-sm relative flex items-center justify-center shrink-0 self-start md:self-auto">
        <svg
          className="w-10 h-10 md:w-16 md:h-16 text-muted-foreground/30 group-hover:text-primary/60 transition-colors duration-500"
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
        <div className="absolute inset-0 bg-gradient-to-t from-muted via-transparent to-transparent hidden md:block" />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 md:gap-3 flex-grow justify-between">
        <div className="flex flex-col gap-1 md:gap-2">
          <h3 className="text-base md:text-xl font-heading text-foreground group-hover:text-primary transition-colors duration-300 line-clamp-1 md:line-clamp-none">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-3">
            {description}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 md:pt-4 border-t border-border flex items-center justify-between w-full mt-2 md:mt-auto">
          <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground">
            {stat}
          </span>
          <svg
            className="w-4 h-4 md:w-5 md:h-5 text-primary opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300"
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

'use client';

import Link from 'next/link';

type Props = {
  question: string;
};


export default function DiscoveryPromptButton({ question }: Props) {
  return (
    <Link
      href="/explore/new"
      className="group rounded-lg border bg-card px-4 py-3 text-left text-sm font-medium text-muted-foreground shadow-sm hover:border-primary/40 hover:bg-muted/50 hover:text-foreground transition-all"
    >
      <span className="mr-1 text-primary opacity-70 group-hover:opacity-100">&ldquo;</span>
      {question}
      <span className="ml-1 text-primary opacity-70 group-hover:opacity-100">&rdquo;</span>
    </Link>
  );
}

'use client';

type Props = {
  position: number;
  documentTitle: string;
  onClick?: () => void;
};

export default function CitationChip({
  position,
  documentTitle,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted/50 text-primary text-xs cursor-pointer hover:shadow-sm transition-all font-mono border border-border"
      aria-label={`View source ${position + 1}: ${documentTitle}`}
      title={documentTitle}
    >
      [{position + 1}]
    </button>
  );
}

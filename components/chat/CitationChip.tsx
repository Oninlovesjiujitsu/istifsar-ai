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
      className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-vault text-gold text-xs cursor-pointer hover:shadow-[0_0_10px_rgba(212,175,55,0.4)] transition-all font-mono border border-gold/20"
      aria-label={`View source ${position + 1}: ${documentTitle}`}
      title={documentTitle}
    >
      [{position + 1}]
    </button>
  );
}

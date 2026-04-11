import { useState } from "react";

interface FootnoteTooltipProps {
  index: number;
  note: string;
}

export function FootnoteTooltip({ index, note }: FootnoteTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-mono bg-primary/15 text-primary rounded-full cursor-pointer hover:bg-primary/25 transition-subtle align-super leading-none ml-0.5"
        aria-label={`Footnote ${index}`}
      >
        {index}
      </button>
      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 text-caption bg-card border border-divider rounded shadow-lg z-40 animate-fade-in">
          {note}
          <span className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-b border-r border-divider rotate-45 -mt-1" />
        </span>
      )}
    </span>
  );
}

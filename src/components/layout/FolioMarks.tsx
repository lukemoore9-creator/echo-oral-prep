"use client";

interface FolioMarksProps {
  left: string;
  right?: string;
}

export function FolioMarks({ left, right = "Echo \u00B7 MMXXVI" }: FolioMarksProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-10 hidden items-center justify-between px-6 sm:flex">
      <span
        className="font-mono text-[10px] uppercase text-ink-muted"
        style={{ letterSpacing: "0.16em" }}
      >
        {left}
      </span>
      <span
        className="font-mono text-[10px] uppercase text-ink-muted"
        style={{ letterSpacing: "0.16em" }}
      >
        {right}
      </span>
    </div>
  );
}

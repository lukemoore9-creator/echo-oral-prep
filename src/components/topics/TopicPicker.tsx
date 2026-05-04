"use client";

import { TOPIC_NAMES, ALL_TOPIC_SLUGS } from "@/lib/topics";

interface TopicPickerProps {
  selected: string | null;
  onSelect: (slug: string) => void;
  showLeadOption?: boolean;
  onSelectLead?: () => void;
  leadSelected?: boolean;
}

export function TopicPicker({
  selected,
  onSelect,
  showLeadOption,
  onSelectLead,
  leadSelected,
}: TopicPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
      {ALL_TOPIC_SLUGS.map((slug) => {
        const isActive = selected === slug && !leadSelected;
        return (
          <button
            key={slug}
            onClick={() => onSelect(slug)}
            className={`group flex items-center justify-between border-b border-rule py-3 text-left transition-colors sm:odd:pr-6 sm:even:pl-6 sm:even:border-l ${
              isActive ? "text-chart-green" : "text-ink"
            }`}
          >
            <span className="font-serif text-[17px] italic" style={{ fontWeight: 400 }}>
              {TOPIC_NAMES[slug]}
            </span>
            {isActive && (
              <span className="font-serif text-[13px] italic text-chart-green" style={{ fontWeight: 400 }}>
                selected
              </span>
            )}
            {!isActive && (
              <span className="h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-8" />
            )}
          </button>
        );
      })}
      {showLeadOption && onSelectLead && (
        <button
          onClick={onSelectLead}
          className={`group flex items-center justify-between border-b border-rule py-3 text-left transition-colors sm:odd:pr-6 sm:even:pl-6 sm:even:border-l ${
            leadSelected ? "text-chart-green" : "text-ink"
          }`}
        >
          <span className="font-serif text-[17px] italic" style={{ fontWeight: 400 }}>
            Wherever you&apos;d like &mdash; let Echo lead
          </span>
          {leadSelected && (
            <span className="font-serif text-[13px] italic text-chart-green" style={{ fontWeight: 400 }}>
              selected
            </span>
          )}
          {!leadSelected && (
            <span className="h-px w-0 bg-chart-green transition-all duration-300 ease-out group-hover:w-8" />
          )}
        </button>
      )}
    </div>
  );
}

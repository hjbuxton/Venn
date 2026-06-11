"use client";

import { cn } from "@/lib/utils";

export function ChipToggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function toggle(optionValue: string) {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              active
                ? "border-brand bg-brand-light text-brand"
                : "border-line bg-white text-ink-2 hover:border-ink-3"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

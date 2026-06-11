"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange as RDPDateRange } from "react-day-picker";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/types/database";

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplay(date?: Date) {
  if (!date) return null;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select dates",
}: {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected: RDPDateRange | undefined = value
    ? { from: new Date(value.from + "T00:00:00"), to: new Date(value.to + "T00:00:00") }
    : undefined;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(range: RDPDateRange | undefined) {
    if (!range || !range.from) {
      onChange(null);
      return;
    }
    onChange({
      from: toISODate(range.from),
      to: toISODate(range.to ?? range.from),
    });
    if (range.from && range.to) {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full h-11 rounded-xl border border-line bg-white px-4 text-sm text-left flex items-center gap-2 outline-none transition-shadow focus:border-brand focus:ring-4 focus:ring-brand-light",
          !value && "text-ink-3"
        )}
      >
        <Calendar size={16} className="text-ink-3 shrink-0" />
        {value ? (
          <span className="text-ink">
            {formatDisplay(selected?.from)} &ndash; {formatDisplay(selected?.to)}
          </span>
        ) : (
          <span>{placeholder}</span>
        )}
      </button>
      {open && (
        <div className="absolute z-20 mt-2 rounded-2xl border border-line bg-white shadow-lg p-3">
          <DayPicker
            className="venn-rdp"
            mode="range"
            numberOfMonths={1}
            selected={selected}
            onSelect={handleSelect}
            disabled={{ before: new Date() }}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FaqAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;

        return (
          <div key={faq.q} className="rounded-2xl border border-line bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-4 p-6 text-left"
            >
              <h3 className="font-bold text-ink">{faq.q}</h3>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-ink-3 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            {isOpen && (
              <p className="px-6 pb-6 text-sm text-ink-3 leading-relaxed">{faq.a}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

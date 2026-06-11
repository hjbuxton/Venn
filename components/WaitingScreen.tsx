"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function WaitingScreen({
  tripName,
  members,
  groupSize,
  inviteUrl,
}: {
  tripName: string;
  members: { name: string; submitted: boolean }[];
  groupSize: number;
  inviteUrl: string;
}) {
  const submittedCount = members.filter((m) => m.submitted).length;
  const progress = groupSize > 0 ? Math.min(submittedCount / groupSize, 1) : 0;

  const [fill, setFill] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFill(progress), 150);
    return () => clearTimeout(t);
  }, [progress]);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-lg text-center">
      <div className="mx-auto mb-8 h-28 w-44">
        <svg viewBox="0 0 48 28" className="h-full w-full" aria-hidden="true">
          <defs>
            <clipPath id="venn-circle-a">
              <circle cx="19" cy="14" r="13" />
            </clipPath>
            <clipPath id="venn-circle-b">
              <circle cx="29" cy="14" r="13" />
            </clipPath>
          </defs>

          <circle cx="19" cy="14" r="13" fill="none" stroke="#2563eb" strokeWidth="0.75" />
          <circle cx="29" cy="14" r="13" fill="none" stroke="#2563eb" strokeWidth="0.75" />

          <g clipPath="url(#venn-circle-a)">
            <rect
              x="0"
              y={28 - 28 * fill}
              width="48"
              height="28"
              fill="#2563eb"
              fillOpacity="0.55"
              style={{ transition: "y 1.2s ease-out" }}
            />
          </g>
          <g clipPath="url(#venn-circle-b)">
            <rect
              x="0"
              y={28 - 28 * fill}
              width="48"
              height="28"
              fill="#2563eb"
              fillOpacity="0.55"
              style={{ transition: "y 1.2s ease-out" }}
            />
          </g>
        </svg>
      </div>

      <h1 className="text-2xl font-extrabold tracking-tight text-ink">
        Hang tight, {tripName} is taking shape
      </h1>
      <p className="mt-2 text-ink-3">
        {submittedCount} of {groupSize} people have shared their preferences. Once
        everyone&apos;s in, you&apos;ll be able to chat and ask Venn for ideas.
      </p>

      <div className="mt-8 rounded-2xl border border-line bg-white divide-y divide-line text-left overflow-hidden">
        {members.map((member, i) => (
          <div key={i} className="flex items-center justify-between px-5 py-3.5">
            <span className="font-medium text-ink">{member.name}</span>
            {member.submitted ? (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                <Check className="h-4 w-4" />
                Done
              </span>
            ) : (
              <span className="flex items-center gap-2 text-sm text-ink-3">
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-line" />
                Waiting
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 text-left">
        <p className="text-sm font-semibold text-ink mb-2">Invite more people</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={inviteUrl}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink-2 truncate"
          />
          <Button type="button" variant="secondary" onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}

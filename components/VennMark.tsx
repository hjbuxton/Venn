import { cn } from "@/lib/utils";

/**
 * The Venn brand mark: two overlapping circles forming the lens shape that
 * represents "where everyone's preferences overlap".
 */
export function VennMark({
  className,
  size = 28,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="11" cy="14" r="9" fill="#2563eb" fillOpacity="0.55" />
      <circle cx="17" cy="14" r="9" fill="#2563eb" fillOpacity="0.55" />
    </svg>
  );
}

export function VennLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <VennMark />
      <span className="text-lg font-extrabold tracking-tight text-ink">Venn</span>
    </span>
  );
}

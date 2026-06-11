import { cn } from "@/lib/utils";
import { TripStatus } from "@/types/database";

const STATUS_LABELS: Record<TripStatus, string> = {
  collecting: "Collecting preferences",
  ready: "Ready to chat",
  planned: "Planned",
};

const STATUS_STYLES: Record<TripStatus, string> = {
  collecting: "bg-brand-light text-brand",
  ready: "bg-green-50 text-green-700",
  planned: "bg-surface text-ink-2",
};

export function TripStatusBadge({ status }: { status: TripStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        STATUS_STYLES[status]
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

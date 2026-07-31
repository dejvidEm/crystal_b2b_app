"use client";

import { cn, getCalendarEventColor, getStatusLabel } from "@/lib/utils";
import type { ServiceRequestListItem, UserRole } from "@/types";

type CalendarEventProps = {
  request: ServiceRequestListItem;
  role: UserRole;
  onClick: () => void;
  compact?: boolean;
};

export function CalendarEvent({
  request,
  role,
  onClick,
  compact = false,
}: CalendarEventProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[8px] border-l-2 px-2 py-1.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        getCalendarEventColor(request.status),
        compact ? "text-xs" : "text-sm",
      )}
    >
      <p className="truncate font-medium text-text">
        {role === "admin"
          ? request.organization?.name ?? request.reference_code
          : request.reference_code}
      </p>
      <p className="truncate text-[11px] text-muted">
        {request.reference_code} · {request.vehicle_count} voz. ·{" "}
        {getStatusLabel(request.status)}
      </p>
    </button>
  );
}

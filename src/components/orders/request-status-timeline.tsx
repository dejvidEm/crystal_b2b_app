import { cn, formatDateTimeSk, getStatusLabel } from "@/lib/utils";
import type { ServiceRequestDetail } from "@/types";

const TIMELINE_STEPS: Array<{
  key: string;
  label: string;
  getAt: (r: ServiceRequestDetail) => string | null;
  isReached: (r: ServiceRequestDetail) => boolean;
}> = [
  {
    key: "created",
    label: "Odoslaná",
    getAt: (r) => r.created_at,
    isReached: () => true,
  },
  {
    key: "confirmed",
    label: "Potvrdená",
    getAt: (r) => r.confirmed_at,
    isReached: (r) =>
      Boolean(r.confirmed_at) ||
      ["confirmed", "in_progress", "completed"].includes(r.status),
  },
  {
    key: "started",
    label: "Prebieha",
    getAt: (r) => r.started_at,
    isReached: (r) =>
      Boolean(r.started_at) || ["in_progress", "completed"].includes(r.status),
  },
  {
    key: "completed",
    label: "Dokončená",
    getAt: (r) => r.completed_at,
    isReached: (r) => Boolean(r.completed_at) || r.status === "completed",
  },
];

export function RequestStatusTimeline({
  request,
}: {
  request: ServiceRequestDetail;
}) {
  const isTerminalRejected =
    request.status === "rejected" || request.status === "cancelled";

  return (
    <div className="rounded-[12px] border border-border bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold text-text">Časová os</h3>

      {isTerminalRejected ? (
        <p className="text-sm text-muted">
          Požiadavka skončila stavom{" "}
          <span className="text-text">{getStatusLabel(request.status)}</span>
          {request.updated_at
            ? ` · ${formatDateTimeSk(request.updated_at)}`
            : null}
        </p>
      ) : (
        <ol className="space-y-4">
          {TIMELINE_STEPS.map((step, index) => {
            const reached = step.isReached(request);
            const at = step.getAt(request);

            return (
              <li key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "mt-1 h-2.5 w-2.5 rounded-full",
                      reached ? "bg-accent" : "bg-white/20",
                    )}
                  />
                  {index < TIMELINE_STEPS.length - 1 ? (
                    <span
                      className={cn(
                        "mt-1 w-px flex-1",
                        reached ? "bg-accent/40" : "bg-border",
                      )}
                    />
                  ) : null}
                </div>
                <div className="pb-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      reached ? "text-text" : "text-muted",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs text-muted">
                    {at ? formatDateTimeSk(at) : "—"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

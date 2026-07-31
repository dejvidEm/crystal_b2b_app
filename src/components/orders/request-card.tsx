import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/orders/status-badge";
import {
  formatDateSk,
  getPriorityLabel,
  getRequestPackageLabel,
  getTimeWindowLabel,
} from "@/lib/utils";
import type { ServiceRequestListItem } from "@/types";

type RequestCardProps = {
  request: ServiceRequestListItem;
  showOrganization?: boolean;
};

export function RequestCard({ request, showOrganization }: RequestCardProps) {
  return (
    <Link
      href={`/orders/${request.id}`}
      className="group block rounded-[12px] border border-border bg-surface p-4 transition-colors hover:border-accent/30 hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-text">{request.reference_code}</p>
            <StatusBadge status={request.status} />
          </div>
          {showOrganization && request.organization ? (
            <p className="truncate text-sm text-muted">
              {request.organization.name}
            </p>
          ) : null}
          <p className="text-sm text-muted">
            {formatDateSk(request.requested_date)} ·{" "}
            {getTimeWindowLabel(request.time_window)} ·{" "}
            {request.vehicle_count} voz.
          </p>
          <p className="text-sm text-muted">
            {getRequestPackageLabel(request.service_package)} ·{" "}
            {getPriorityLabel(request.priority)}
          </p>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
      </div>
    </Link>
  );
}

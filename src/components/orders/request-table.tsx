"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/orders/status-badge";
import { Button } from "@/components/ui/button";
import {
  formatDateSk,
  getPriorityLabel,
  getRequestPackageLabel,
} from "@/lib/utils";
import type { RequestStatus, ServiceRequestListItem } from "@/types";
import { ADMIN_STATUS_ACTIONS } from "@/config/constants";
import { useUpdateRequestStatus } from "@/hooks/use-requests";

type RequestTableProps = {
  requests: ServiceRequestListItem[];
  showOrganization?: boolean;
  showActions?: boolean;
};

export function RequestTable({
  requests,
  showOrganization = false,
  showActions = false,
}: RequestTableProps) {
  const updateStatus = useUpdateRequestStatus();

  return (
    <div className="overflow-hidden rounded-[12px] border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-surface-elevated/80 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Referencia</th>
              {showOrganization ? (
                <th className="px-4 py-3 font-medium">Organizácia</th>
              ) : null}
              <th className="px-4 py-3 font-medium">Dátum</th>
              <th className="px-4 py-3 font-medium">Balík</th>
              <th className="px-4 py-3 font-medium">Vozidlá</th>
              <th className="px-4 py-3 font-medium">Priorita</th>
              <th className="px-4 py-3 font-medium">Stav</th>
              {showActions ? (
                <th className="px-4 py-3 font-medium">Akcie</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => {
              const actions =
                ADMIN_STATUS_ACTIONS[
                  request.status as keyof typeof ADMIN_STATUS_ACTIONS
                ] ?? [];

              return (
                <tr
                  key={request.id}
                  className="border-b border-border/70 bg-surface last:border-0 hover:bg-surface-elevated/60"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/orders/${request.id}`}
                      className="font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                    >
                      {request.reference_code}
                    </Link>
                  </td>
                  {showOrganization ? (
                    <td className="px-4 py-3 text-text">
                      {request.organization?.name ?? "—"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-text">
                    {formatDateSk(request.requested_date)}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {getRequestPackageLabel(request.service_package)}
                  </td>
                  <td className="px-4 py-3 text-text">{request.vehicle_count}</td>
                  <td className="px-4 py-3 text-muted">
                    {getPriorityLabel(request.priority)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  {showActions ? (
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {actions.map((action) => (
                          <Button
                            key={action.status}
                            size="sm"
                            variant={action.variant}
                            disabled={updateStatus.isPending}
                            onClick={() =>
                              updateStatus.mutate({
                                requestId: request.id,
                                status: action.status as RequestStatus,
                              })
                            }
                          >
                            {action.label}
                          </Button>
                        ))}
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/orders/${request.id}`}>Detail</Link>
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

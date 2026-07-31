"use client";

import Link from "next/link";
import { AdminStatusActions } from "@/components/orders/admin-status-actions";
import { StatusBadge } from "@/components/orders/status-badge";
import { RequestCard } from "@/components/orders/request-card";
import { Button } from "@/components/ui/button";
import {
  formatDateSk,
  formatTimeSk,
  getPriorityLabel,
  getRequestPackageLabel,
} from "@/lib/utils";
import type { ServiceRequestListItem } from "@/types";
import { ADMIN_STATUS_ACTIONS } from "@/config/constants";
import { usePendingCancel } from "@/hooks/use-pending-cancel";

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
  const { isPendingCancel, secondsLeft } = usePendingCancel();

  return (
    <>
      {/* Mobile: cards */}
      <div className="grid gap-3 md:hidden">
        {requests.map((request) => {
          const actions =
            ADMIN_STATUS_ACTIONS[
              request.status as keyof typeof ADMIN_STATUS_ACTIONS
            ] ?? [];
          const cancelling = isPendingCancel(request.id);

          return (
            <div key={request.id} className="space-y-3">
              <RequestCard
                request={request}
                showOrganization={showOrganization}
              />
              {cancelling ? (
                <p className="px-1 text-sm text-amber-200">
                  Zrušenie o {secondsLeft} s — partner ešte nevidí zmenu.
                </p>
              ) : null}
              {showActions && actions.length > 0 ? (
                <AdminStatusActions
                  requestId={request.id}
                  referenceCode={request.reference_code}
                  status={request.status}
                  fullWidth
                  className="flex flex-wrap gap-2 px-1"
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-[12px] border border-border md:block">
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
                const cancelling = isPendingCancel(request.id);

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
                      {formatDateSk(request.requested_date)} ·{" "}
                      {formatTimeSk(request.requested_time)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {getRequestPackageLabel(request.service_package)}
                    </td>
                    <td className="px-4 py-3 text-text">
                      {request.vehicle_count}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {getPriorityLabel(request.priority)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <StatusBadge status={request.status} />
                        {cancelling ? (
                          <p className="text-[11px] text-amber-200">
                            Zrušenie o {secondsLeft} s
                          </p>
                        ) : null}
                      </div>
                    </td>
                    {showActions ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {actions.length > 0 ? (
                            <AdminStatusActions
                              requestId={request.id}
                              referenceCode={request.reference_code}
                              status={request.status}
                              size="sm"
                              className="flex flex-wrap gap-2"
                            />
                          ) : null}
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
    </>
  );
}

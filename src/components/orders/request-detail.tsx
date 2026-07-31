"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/orders/status-badge";
import { RequestStatusTimeline } from "@/components/orders/request-status-timeline";
import { Button } from "@/components/ui/button";
import { ADMIN_STATUS_ACTIONS, CONFIRMATION_NOTICE } from "@/config/constants";
import { useUpdateRequestStatus } from "@/hooks/use-requests";
import {
  formatDateSk,
  formatDateTimeSk,
  getPackageLabel,
  getPriorityLabel,
  getTimeWindowLabel,
  getVehiclesPackageSummary,
} from "@/lib/utils";
import type { RequestStatus, ServiceRequestDetail, UserRole } from "@/types";

type RequestDetailProps = {
  request: ServiceRequestDetail;
  role: UserRole;
  compact?: boolean;
};

export function RequestDetail({
  request,
  role,
  compact = false,
}: RequestDetailProps) {
  const updateStatus = useUpdateRequestStatus();
  const actions =
    role === "admin"
      ? (ADMIN_STATUS_ACTIONS[
          request.status as keyof typeof ADMIN_STATUS_ACTIONS
        ] ?? [])
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-text">
              {request.reference_code}
            </h2>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {request.organization?.name ?? "Organizácia"}
          </p>
        </div>
        {!compact ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">Späť na zoznam</Link>
          </Button>
        ) : null}
      </div>

      {request.status === "pending" ? (
        <div className="rounded-[12px] border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {CONFIRMATION_NOTICE}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem label="Požadovaný dátum" value={formatDateSk(request.requested_date)} />
        <InfoItem label="Časové okno" value={getTimeWindowLabel(request.time_window)} />
        <InfoItem
          label="Balíky"
          value={getVehiclesPackageSummary(request.vehicles)}
        />
        <InfoItem label="Priorita" value={getPriorityLabel(request.priority)} />
        <InfoItem label="Počet vozidiel" value={String(request.vehicle_count)} />
        <InfoItem label="Odoslané" value={formatDateTimeSk(request.created_at)} />
      </div>

      {request.partner_note ? (
        <NoteBlock title="Poznámka partnera" text={request.partner_note} />
      ) : null}

      {request.admin_note ? (
        <NoteBlock title="Poznámka administrátora" text={request.admin_note} />
      ) : null}

      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.status}
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
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[12px] border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text">Vozidlá</h3>
          </div>
          <ul className="divide-y divide-border">
            {request.vehicles.map((vehicle, index) => (
              <li key={vehicle.id} className="px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-text">
                    {index + 1}. {vehicle.license_plate}
                  </p>
                  <p className="text-sm text-accent">
                    {getPackageLabel(vehicle.service_package)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {[vehicle.make_model, vehicle.internal_reference]
                    .filter(Boolean)
                    .join(" · ") || "Bez ďalších údajov"}
                </p>
                {vehicle.note ? (
                  <p className="mt-1 text-sm text-muted">{vehicle.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <RequestStatusTimeline request={request} />
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function NoteBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[12px] border border-border bg-surface px-4 py-3">
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-text">{text}</p>
    </div>
  );
}

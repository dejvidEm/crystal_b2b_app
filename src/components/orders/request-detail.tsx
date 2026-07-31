"use client";

import Link from "next/link";
import { AdminStatusActions } from "@/components/orders/admin-status-actions";
import { StatusBadge } from "@/components/orders/status-badge";
import { RequestStatusTimeline } from "@/components/orders/request-status-timeline";
import { VehicleCategoryBadge } from "@/components/vehicles/vehicle-category-badge";
import { Button } from "@/components/ui/button";
import { CONFIRMATION_NOTICE } from "@/config/constants";
import { usePendingCancel } from "@/hooks/use-pending-cancel";
import {
  formatDateSk,
  formatDateTimeSk,
  getPackageLabel,
  getPriorityLabel,
  formatTimeSk,
  getVehicleDisplayName,
  getVehiclePrimaryId,
  getVehiclesPackageSummary,
} from "@/lib/utils";
import type { ServiceRequestDetail, UserRole } from "@/types";

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
  const { isPendingCancel, secondsLeft } = usePendingCancel();
  const cancelling = isPendingCancel(request.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold text-text">
              {request.reference_code}
            </h2>
            <StatusBadge status={request.status} />
            {cancelling ? (
              <span className="text-xs font-medium text-amber-200">
                Zrušenie o {secondsLeft} s
              </span>
            ) : null}
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
        <InfoItem label="Čas" value={formatTimeSk(request.requested_time)} />
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

      {role === "admin" ? (
        <AdminStatusActions
          requestId={request.id}
          referenceCode={request.reference_code}
          status={request.status}
          fullWidth
        />
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
                  <div>
                    <p className="font-medium text-text">
                      {index + 1}. {getVehiclePrimaryId(vehicle)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {getVehicleDisplayName(vehicle)}
                      {vehicle.color ? ` · ${vehicle.color}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {vehicle.category ? (
                      <VehicleCategoryBadge category={vehicle.category} />
                    ) : null}
                    <p className="text-sm text-accent">
                      {getPackageLabel(vehicle.service_package)}
                    </p>
                  </div>
                </div>
                {vehicle.vin && vehicle.license_plate ? (
                  <p className="mt-1 text-xs text-muted">VIN: {vehicle.vin}</p>
                ) : null}
                {vehicle.internal_reference &&
                vehicle.internal_reference !== getVehiclePrimaryId(vehicle) ? (
                  <p className="mt-1 text-xs text-muted">
                    Interné: {vehicle.internal_reference}
                  </p>
                ) : null}
                {vehicle.note ? (
                  <p className="mt-1 text-sm text-muted">{vehicle.note}</p>
                ) : null}
                {vehicle.vehicle_id && role === "partner" ? (
                  <Button asChild variant="link" className="mt-1 h-auto px-0 text-xs">
                    <Link href="/vehicles">Otvoriť v evidencii</Link>
                  </Button>
                ) : null}
                {vehicle.vehicle_id ? (
                  <p className="mt-1 text-[11px] text-muted">Prepojené s evidenciou</p>
                ) : (
                  <p className="mt-1 text-[11px] text-muted">
                    Historický záznam bez väzby na evidenciu
                  </p>
                )}
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

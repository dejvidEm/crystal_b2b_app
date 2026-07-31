"use client";

import { Archive, Pencil, RotateCcw } from "lucide-react";
import { VehicleCategoryBadge } from "@/components/vehicles/vehicle-category-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getVehicleDisplayName,
  getVehiclePrimaryId,
} from "@/lib/utils";
import type { Vehicle } from "@/types";

type VehicleListProps = {
  vehicles: Vehicle[];
  onEdit: (vehicle: Vehicle) => void;
  onArchive: (vehicle: Vehicle) => void;
  onReactivate: (vehicle: Vehicle) => void;
  busyId?: string | null;
};

export function VehicleTable({
  vehicles,
  onEdit,
  onArchive,
  onReactivate,
  busyId,
}: VehicleListProps) {
  return (
    <div className="hidden overflow-hidden rounded-[12px] border border-border md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-surface-elevated/80 text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Identifikátor</th>
              <th className="px-4 py-3 font-medium">Značka / model</th>
              <th className="px-4 py-3 font-medium">Kategória</th>
              <th className="px-4 py-3 font-medium">Priradená osoba</th>
              <th className="px-4 py-3 font-medium">Stav</th>
              <th className="px-4 py-3 font-medium">Akcie</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr
                key={vehicle.id}
                className="border-b border-border/70 bg-surface last:border-0 hover:bg-surface-elevated/60"
              >
                <td className="px-4 py-3 font-medium text-text">
                  {getVehiclePrimaryId(vehicle)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {getVehicleDisplayName(vehicle)}
                  {vehicle.year ? ` · ${vehicle.year}` : ""}
                </td>
                <td className="px-4 py-3">
                  <VehicleCategoryBadge category={vehicle.category} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {vehicle.assigned_person || "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      vehicle.is_active
                        ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : "border-white/10 bg-white/5 text-muted"
                    }
                  >
                    {vehicle.is_active ? "Aktívne" : "Archivované"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === vehicle.id}
                      onClick={() => onEdit(vehicle)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Upraviť
                    </Button>
                    {vehicle.is_active ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === vehicle.id}
                        onClick={() => onArchive(vehicle)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archivovať
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === vehicle.id}
                        onClick={() => onReactivate(vehicle)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Obnoviť
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VehicleMobileCards({
  vehicles,
  onEdit,
  onArchive,
  onReactivate,
  busyId,
}: VehicleListProps) {
  return (
    <div className="grid gap-3 md:hidden">
      {vehicles.map((vehicle) => (
        <div
          key={vehicle.id}
          className="rounded-[12px] border border-border bg-surface p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-text">
                {getVehiclePrimaryId(vehicle)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {getVehicleDisplayName(vehicle)}
                {vehicle.year ? ` · ${vehicle.year}` : ""}
              </p>
            </div>
            <VehicleCategoryBadge category={vehicle.category} />
          </div>
          {vehicle.assigned_person ? (
            <p className="mt-2 text-sm text-muted">
              Priradené: {vehicle.assigned_person}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge
              className={
                vehicle.is_active
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-muted"
              }
            >
              {vehicle.is_active ? "Aktívne" : "Archivované"}
            </Badge>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="outline"
              className="min-h-11"
              disabled={busyId === vehicle.id}
              onClick={() => onEdit(vehicle)}
            >
              Upraviť
            </Button>
            {vehicle.is_active ? (
              <Button
                variant="ghost"
                className="min-h-11"
                disabled={busyId === vehicle.id}
                onClick={() => onArchive(vehicle)}
              >
                Archivovať
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="min-h-11"
                disabled={busyId === vehicle.id}
                onClick={() => onReactivate(vehicle)}
              >
                Obnoviť
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

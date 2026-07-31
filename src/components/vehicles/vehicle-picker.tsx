"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { VehicleCategoryBadge } from "@/components/vehicles/vehicle-category-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSkeleton } from "@/components/layout/loading-skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { useActiveVehicles } from "@/hooks/use-vehicles";
import { VEHICLE_CATEGORIES } from "@/config/constants";
import {
  cn,
  getVehicleDisplayName,
  getVehiclePrimaryId,
} from "@/lib/utils";
import type { Vehicle, VehicleCategory } from "@/types";

type VehiclePickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onConfirm: (vehicles: Vehicle[]) => void;
};

export function VehiclePicker({
  open,
  onOpenChange,
  selectedIds,
  onConfirm,
}: VehiclePickerProps) {
  const { data: vehicles = [], isLoading, isError, error } = useActiveVehicles();
  const [category, setCategory] = useState<VehicleCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [sessionKey, setSessionKey] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftIds(selectedIds);
      setSearch("");
      setCategory("all");
      setSessionKey((value) => value + 1);
    }
    onOpenChange(nextOpen);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (category !== "all" && vehicle.category !== category) return false;
      if (!q) return true;
      const haystack = [
        vehicle.license_plate,
        vehicle.vin,
        vehicle.internal_reference,
        vehicle.brand,
        vehicle.model,
        vehicle.assigned_person,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [vehicles, category, search]);

  function toggle(id: string) {
    setDraftIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function confirm() {
    const selected = vehicles.filter((vehicle) => draftIds.includes(vehicle.id));
    onConfirm(selected);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        key={sessionKey}
        className="flex max-h-[min(90vh,840px)] max-w-2xl flex-col gap-0 overflow-hidden p-0"
      >
        <div className="border-b border-border px-5 py-4">
          <DialogHeader>
            <DialogTitle>Vybrať z evidencie</DialogTitle>
          </DialogHeader>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Hľadať EČV, VIN, značku…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip
              active={category === "all"}
              onClick={() => setCategory("all")}
              label="Všetky"
            />
            {VEHICLE_CATEGORIES.map((item) => (
              <FilterChip
                key={item.value}
                active={category === item.value}
                onClick={() => setCategory(item.value)}
                label={item.shortLabel}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading ? <LoadingSkeleton rows={5} /> : null}
          {isError ? (
            <p className="text-sm text-rose-300">
              {error instanceof Error ? error.message : "Chyba načítania"}
            </p>
          ) : null}
          {!isLoading && !isError && filtered.length === 0 ? (
            <EmptyState
              title="Žiadne vozidlá"
              description="V tejto kategórii nie sú aktívne vozidlá, alebo nič nezodpovedá vyhľadávaniu."
            />
          ) : null}
          <div className="space-y-2">
            {filtered.map((vehicle) => {
              const checked = draftIds.includes(vehicle.id);
              const alreadyInRequest = selectedIds.includes(vehicle.id);
              return (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => toggle(vehicle.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[12px] border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                    checked
                      ? "border-accent/40 bg-accent/10"
                      : "border-border bg-surface hover:bg-surface-elevated",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border",
                      checked
                        ? "border-accent bg-accent text-background"
                        : "border-border",
                    )}
                  >
                    {checked ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-text">
                        {getVehiclePrimaryId(vehicle)}
                      </span>
                      <VehicleCategoryBadge category={vehicle.category} />
                      {alreadyInRequest ? (
                        <span className="text-[11px] text-muted">vybrané</span>
                      ) : null}
                    </span>
                    <span className="mt-1 block text-sm text-muted">
                      {getVehicleDisplayName(vehicle)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-between">
          <p className="text-sm text-muted">Vybrané: {draftIds.length}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Zrušiť
            </Button>
            <Button onClick={confirm}>Pridať vybrané</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[8px] border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border text-muted hover:text-text",
      )}
    >
      {label}
    </button>
  );
}

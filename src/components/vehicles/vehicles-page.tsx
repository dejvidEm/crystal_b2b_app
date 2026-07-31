"use client";

import { useEffect, useMemo, useState } from "react";
import { CarFront, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import {
  LoadingSkeleton,
  StatCardsSkeleton,
} from "@/components/layout/loading-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { VehicleForm } from "@/components/vehicles/vehicle-form";
import {
  VehicleMobileCards,
  VehicleTable,
} from "@/components/vehicles/vehicle-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useCreateVehicle,
  useSetVehicleActive,
  useUpdateVehicle,
  useVehicles,
} from "@/hooks/use-vehicles";
import { VEHICLE_CATEGORIES } from "@/config/constants";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleCategory, VehicleInput } from "@/types";

export function VehiclesPage() {
  const [category, setCategory] = useState<VehicleCategory | "all">("all");
  const [status, setStatus] = useState<"active" | "archived" | "all">("active");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Vehicle | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchInput), 250);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const filters = useMemo(
    () => ({ category, status, search }),
    [category, status, search],
  );

  const { data: vehicles = [], isLoading, isError, error } = useVehicles(filters);
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const setActive = useSetVehicleActive();

  const allVehiclesQuery = useVehicles({ status: "all", category: "all" });
  const summary = useMemo(() => {
    const active = (allVehiclesQuery.data ?? []).filter((v) => v.is_active);
    return {
      totalActive: active.length,
      rental: active.filter((v) => v.category === "rental").length,
      staff: active.filter((v) => v.category === "staff").length,
      forSale: active.filter((v) => v.category === "for_sale").length,
    };
  }, [allVehiclesQuery.data]);

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(vehicle: Vehicle) {
    setEditing(vehicle);
    setEditorOpen(true);
  }

  async function handleSubmit(input: VehicleInput) {
    if (editing) {
      await updateVehicle.mutateAsync({ id: editing.id, input });
    } else {
      await createVehicle.mutateAsync(input);
    }
    setEditorOpen(false);
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Evidencia vozidiel"
        description="Spravujte vozidlá vašej organizácie a používajte ich pri nových požiadavkách."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Pridať vozidlo
          </Button>
        }
      />

      {allVehiclesQuery.isLoading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Aktívne vozidlá" value={summary.totalActive} icon={CarFront} />
          <StatCard label="Z požičovne" value={summary.rental} />
          <StatCard label="Personál" value={summary.staff} />
          <StatCard label="Na predaj" value={summary.forSale} />
        </div>
      )}

      <div className="mb-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-9"
              placeholder="Hľadať EČV, VIN, značku, osobu…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div
            className="inline-flex w-full rounded-[10px] border border-border bg-surface p-1 sm:w-auto"
            role="group"
            aria-label="Stav vozidiel"
          >
            <StatusToggle
              active={status === "active"}
              tone="active"
              label="Aktívne"
              onClick={() => setStatus("active")}
            />
            <StatusToggle
              active={status === "archived"}
              tone="archived"
              label="Archivované"
              onClick={() => setStatus("archived")}
            />
            <StatusToggle
              active={status === "all"}
              tone="all"
              label="Všetky"
              onClick={() => setStatus("all")}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
            Kategória
          </p>
          <div className="flex flex-wrap gap-2">
            <FilterChip
              active={category === "all"}
              label="Všetky"
              onClick={() => setCategory("all")}
            />
            {VEHICLE_CATEGORIES.map((item) => (
              <FilterChip
                key={item.value}
                active={category === item.value}
                label={item.shortLabel}
                onClick={() => setCategory(item.value)}
              />
            ))}
          </div>
        </div>
      </div>

      {isLoading ? <LoadingSkeleton rows={6} /> : null}
      {isError ? (
        <EmptyState
          title="Evidenciu sa nepodarilo načítať"
          description={error instanceof Error ? error.message : undefined}
        />
      ) : null}

      {!isLoading && !isError && vehicles.length === 0 ? (
        <EmptyState
          icon={CarFront}
          title="Zatiaľ nemáte zaevidované žiadne vozidlá."
          description="Pridajte prvé vozidlo a pri ďalšej požiadavke ho vyberiete bez opakovaného vypĺňania údajov."
          actionLabel="Pridať vozidlo"
          onAction={openCreate}
        />
      ) : null}

      {!isLoading && !isError && vehicles.length > 0 ? (
        <>
          <VehicleTable
            vehicles={vehicles}
            onEdit={openEdit}
            onArchive={setArchiveTarget}
            onReactivate={(vehicle) =>
              setActive.mutate({ id: vehicle.id, isActive: true })
            }
            busyId={setActive.isPending ? setActive.variables?.id : null}
          />
          <VehicleMobileCards
            vehicles={vehicles}
            onEdit={openEdit}
            onArchive={setArchiveTarget}
            onReactivate={(vehicle) =>
              setActive.mutate({ id: vehicle.id, isActive: true })
            }
            busyId={setActive.isPending ? setActive.variables?.id : null}
          />
        </>
      ) : null}

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Upraviť vozidlo" : "Pridať vozidlo"}
            </DialogTitle>
          </DialogHeader>
          <VehicleForm
            key={editing?.id ?? "new"}
            initialVehicle={editing}
            submitLabel={editing ? "Uložiť zmeny" : "Pridať vozidlo"}
            isSubmitting={createVehicle.isPending || updateVehicle.isPending}
            onCancel={() => {
              setEditorOpen(false);
              setEditing(null);
            }}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title="Archivovať vozidlo?"
        description="Archivované vozidlo ostane v histórii, ale nebude možné ho vybrať do novej požiadavky."
        confirmLabel="Archivovať"
        destructive
        onConfirm={() => {
          if (!archiveTarget) return;
          setActive.mutate({ id: archiveTarget.id, isActive: false });
          setArchiveTarget(null);
        }}
      />
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
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

function StatusToggle({
  active,
  tone,
  label,
  onClick,
}: {
  active: boolean;
  tone: "active" | "archived" | "all";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 flex-1 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors sm:min-w-[7.5rem] sm:flex-none",
        !active && "text-muted hover:bg-white/5 hover:text-text",
        active &&
          tone === "active" &&
          "bg-emerald-500/20 text-emerald-300 shadow-sm",
        active && tone === "archived" && "bg-white/10 text-[#a1a8b3]",
        active && tone === "all" && "bg-accent/15 text-accent",
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            tone === "active" && (active ? "bg-emerald-300" : "bg-emerald-500/50"),
            tone === "archived" && (active ? "bg-[#929aa5]" : "bg-white/25"),
            tone === "all" && (active ? "bg-accent" : "bg-accent/40"),
          )}
        />
        {label}
      </span>
    </button>
  );
}

"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { VehicleFields } from "@/components/orders/vehicle-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  MAX_VEHICLES_PER_DISPATCH,
  MIN_VEHICLES_PER_DISPATCH,
  PRIORITIES,
  SERVICE_PACKAGES,
  TERM_VALIDITY_NOTICE,
  TIME_WINDOWS,
} from "@/config/constants";
import { useCreateRequest } from "@/hooks/use-requests";
import {
  createRequestSchema,
  type CreateRequestFormValues,
} from "@/schemas/request";
import {
  cn,
  earliestRequestDate,
  formatDateSk,
  getPackageLabel,
  getPriorityLabel,
  getTimeWindowLabel,
  getVehiclesPackageSummary,
} from "@/lib/utils";
import type { ProfileWithOrganization, ServicePackage } from "@/types";

function emptyVehicle(servicePackage: ServicePackage = "fleet_refresh") {
  return {
    license_plate: "",
    make_model: "",
    internal_reference: "",
    note: "",
    service_package: servicePackage,
  };
}

export function NewRequestForm({
  profile,
}: {
  profile: ProfileWithOrganization;
}) {
  const router = useRouter();
  const createRequest = useCreateRequest();
  const [confirmReduceOpen, setConfirmReduceOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const minDate = useMemo(() => earliestRequestDate(), []);

  const form = useForm<CreateRequestFormValues>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      requested_date: minDate,
      time_window: "flexible",
      default_package: "fleet_refresh",
      priority: "standard",
      partner_note: "",
      vehicle_count: MIN_VEHICLES_PER_DISPATCH,
      vehicles: Array.from({ length: MIN_VEHICLES_PER_DISPATCH }, () =>
        emptyVehicle("fleet_refresh"),
      ),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  const vehicleCount =
    useWatch({ control: form.control, name: "vehicle_count" }) ??
    MIN_VEHICLES_PER_DISPATCH;
  const watchedVehicles =
    useWatch({ control: form.control, name: "vehicles" }) ?? [];
  const requestedDate =
    useWatch({ control: form.control, name: "requested_date" }) ?? minDate;
  const timeWindow =
    useWatch({ control: form.control, name: "time_window" }) ?? "flexible";
  const defaultPackage =
    useWatch({ control: form.control, name: "default_package" }) ??
    "fleet_refresh";
  const priority =
    useWatch({ control: form.control, name: "priority" }) ?? "standard";

  function isVehiclePopulated(index: number) {
    const vehicle = form.getValues(`vehicles.${index}`);
    if (!vehicle) return false;
    return Boolean(
      vehicle.license_plate.trim() ||
        vehicle.make_model?.trim() ||
        vehicle.internal_reference?.trim() ||
        vehicle.note?.trim(),
    );
  }

  function applyDefaultPackageToAll() {
    const pkg = form.getValues("default_package");
    const current = form.getValues("vehicles");
    current.forEach((_, index) => {
      form.setValue(`vehicles.${index}.service_package`, pkg, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
    toast.success("Balík bol nastavený pre všetky vozidlá");
  }

  function applyVehicleCount(nextCount: number) {
    const current = form.getValues("vehicle_count");
    const clamped = Math.min(
      MAX_VEHICLES_PER_DISPATCH,
      Math.max(MIN_VEHICLES_PER_DISPATCH, nextCount),
    );

    if (clamped === current) return;

    if (clamped > current) {
      const pkg = form.getValues("default_package");
      for (let i = current; i < clamped; i += 1) {
        append(emptyVehicle(pkg));
      }
      form.setValue("vehicle_count", clamped);
      return;
    }

    const removingPopulated = Array.from(
      { length: current - clamped },
      (_, i) => current - 1 - i,
    ).some((index) => isVehiclePopulated(index));

    if (removingPopulated) {
      setPendingCount(clamped);
      setConfirmReduceOpen(true);
      return;
    }

    for (let i = current - 1; i >= clamped; i -= 1) {
      remove(i);
    }
    form.setValue("vehicle_count", clamped);
  }

  function confirmReduce() {
    if (pendingCount == null) return;
    const current = form.getValues("vehicle_count");
    for (let i = current - 1; i >= pendingCount; i -= 1) {
      remove(i);
    }
    form.setValue("vehicle_count", pendingCount);
    setPendingCount(null);
    setConfirmReduceOpen(false);
  }

  async function onSubmit(data: CreateRequestFormValues) {
    try {
      const id = await createRequest.mutateAsync({
        requested_date: data.requested_date,
        time_window: data.time_window,
        priority: data.priority,
        partner_note: data.partner_note,
        vehicles: data.vehicles.map((v) => ({
          license_plate: v.license_plate,
          make_model: v.make_model || undefined,
          internal_reference: v.internal_reference || undefined,
          note: v.note || undefined,
          service_package: v.service_package,
        })),
      });
      toast.success("Požiadavka bola odoslaná");
      form.reset();
      router.push(`/orders/${id}`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Nepodarilo sa odoslať požiadavku",
      );
    }
  }

  return (
    <>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        noValidate
      >
        <Section title="Termín" description="Vyberte dátum a preferované časové okno.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="requested_date">Požadovaný dátum *</Label>
              <Controller
                control={form.control}
                name="requested_date"
                render={({ field, fieldState }) => (
                  <div>
                    <Input
                      id="requested_date"
                      type="date"
                      min={minDate}
                      {...field}
                    />
                    {fieldState.error ? (
                      <p className="mt-1 text-xs text-rose-300">
                        {fieldState.error.message}
                      </p>
                    ) : null}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>Časové okno *</Label>
              <Controller
                control={form.control}
                name="time_window"
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-3">
                    {TIME_WINDOWS.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        selected={field.value === option.value}
                        onClick={() => field.onChange(option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-3">
              <Label>Priorita *</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {PRIORITIES.map((option) => (
                      <ChoiceButton
                        key={option.value}
                        selected={field.value === option.value}
                        onClick={() => field.onChange(option.value)}
                        label={option.label}
                      />
                    ))}
                  </div>
                )}
              />
            </div>
          </div>
        </Section>

        <Section
          title="Typ služby"
          description="Nastavte predvolený balík pre všetky vozidlá, alebo ho neskôr upravte pri každom aute zvlášť."
        >
          <Controller
            control={form.control}
            name="default_package"
            render={({ field }) => (
              <div className="grid gap-3">
                {SERVICE_PACKAGES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => field.onChange(option.value)}
                    className={cn(
                      "rounded-[12px] border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                      field.value === option.value
                        ? "border-accent/50 bg-accent/10"
                        : "border-border bg-surface hover:bg-surface-elevated",
                    )}
                  >
                    <p className="font-medium text-text">{option.label}</p>
                    <p className="mt-1 text-sm text-muted">{option.description}</p>
                  </button>
                ))}
              </div>
            )}
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Predvolené:{" "}
              <span className="text-text">
                {getPackageLabel(defaultPackage)}
              </span>
              . Nové autá dostanú tento balík automaticky.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={applyDefaultPackageToAll}
            >
              Použiť pre všetky vozidlá
            </Button>
          </div>
        </Section>

        <Section
          title="Vozidlá"
          description={`Minimálne ${MIN_VEHICLES_PER_DISPATCH} vozidlá na jeden výjazd. Pri každom aute vyberte vlastný typ služby.`}
        >
          <div className="mb-4 flex items-center gap-3">
            <Label>Počet vozidiel</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Znížiť počet"
                onClick={() => applyVehicleCount(vehicleCount - 1)}
                disabled={vehicleCount <= MIN_VEHICLES_PER_DISPATCH}
              >
                <Minus />
              </Button>
              <span className="min-w-10 text-center text-lg font-semibold text-text">
                {vehicleCount}
              </span>
              <Button
                type="button"
                size="icon"
                variant="outline"
                aria-label="Zvýšiť počet"
                onClick={() => applyVehicleCount(vehicleCount + 1)}
                disabled={vehicleCount >= MAX_VEHICLES_PER_DISPATCH}
              >
                <Plus />
              </Button>
            </div>
          </div>

          <VehicleFields control={form.control} fields={fields} />
        </Section>

        <Section title="Poznámka" description="Voliteľná poznámka k celej požiadavke.">
          <Controller
            control={form.control}
            name="partner_note"
            render={({ field }) => (
              <Textarea
                placeholder="Napr. prístup do areálu, kontakt na mieste…"
                {...field}
              />
            )}
          />
        </Section>

        <Section title="Súhrn" description="Skontrolujte údaje pred odoslaním.">
          <dl className="grid gap-3 sm:grid-cols-2">
            <SummaryItem
              label="Organizácia"
              value={profile.organization?.name ?? "—"}
            />
            <SummaryItem
              label="Dátum"
              value={requestedDate ? formatDateSk(requestedDate) : "—"}
            />
            <SummaryItem
              label="Časové okno"
              value={getTimeWindowLabel(timeWindow)}
            />
            <SummaryItem
              label="Balíky"
              value={getVehiclesPackageSummary(
                watchedVehicles.map((v) => ({
                  service_package:
                    v.service_package ?? ("fleet_refresh" as ServicePackage),
                })),
              )}
            />
            <SummaryItem
              label="Priorita"
              value={getPriorityLabel(priority)}
            />
            <SummaryItem
              label="Počet vozidiel"
              value={String(vehicleCount)}
            />
          </dl>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {watchedVehicles.map((vehicle, index) => (
              <li key={index}>
                {index + 1}. {vehicle.license_plate || "—"}
                {vehicle.make_model ? ` · ${vehicle.make_model}` : ""}
                {vehicle.service_package
                  ? ` · ${getPackageLabel(vehicle.service_package)}`
                  : ""}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-amber-200/90">{TERM_VALIDITY_NOTICE}</p>
        </Section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={createRequest.isPending || form.formState.isSubmitting}
          >
            {createRequest.isPending ? "Odosielam…" : "Odoslať požiadavku"}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmReduceOpen}
        onOpenChange={setConfirmReduceOpen}
        title="Odstrániť vyplnené vozidlá?"
        description="Znížením počtu odstránite riadky s už vyplnenými údajmi. Túto akciu nie je možné vrátiť."
        confirmLabel="Odstrániť"
        destructive
        onConfirm={confirmReduce}
      />
    </>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-border bg-surface p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-[10px] border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
        selected
          ? "border-accent/50 bg-accent/10 text-text"
          : "border-border bg-surface-elevated text-muted hover:text-text",
      )}
    >
      {label}
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-border bg-surface-elevated px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-text">{value}</dd>
    </div>
  );
}

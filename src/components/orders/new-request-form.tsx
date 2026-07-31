"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { VehicleCategoryBadge } from "@/components/vehicles/vehicle-category-badge";
import { VehiclePicker } from "@/components/vehicles/vehicle-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_REQUEST_TIME,
  MIN_VEHICLES_PER_DISPATCH,
  PRIORITIES,
  REQUEST_TIMES,
  SERVICE_PACKAGES,
  TERM_VALIDITY_NOTICE,
} from "@/config/constants";
import { useCreateRequest } from "@/hooks/use-requests";
import {
  createRequestSchema,
  type CreateRequestFormValues,
  type SelectedRequestVehicle,
} from "@/schemas/request";
import {
  cn,
  earliestRequestDate,
  formatDateSk,
  formatTimeSk,
  getPackageLabel,
  getPriorityLabel,
  getVehicleDisplayName,
  getVehiclePrimaryId,
  getVehiclesPackageSummary,
  normalizeLicensePlate,
} from "@/lib/utils";
import type {
  CreateServiceRequestVehicleInput,
  ProfileWithOrganization,
  ServicePackage,
  Vehicle,
} from "@/types";

const STEPS = [
  {
    id: 1,
    label: "Termín",
    title: "Vyberte termín",
    description:
      "Zvoľte požadovaný dátum, presný čas a prioritu požiadavky.",
  },
  {
    id: 2,
    label: "Vozidlá",
    title: "Pridajte vozidlá",
    description:
      "Vyberte vozidlá z evidencie alebo doplňte údaje manuálne.",
  },
  {
    id: 3,
    label: "Prehľad",
    title: "Skontrolujte a odošlite",
    description:
      "Skontrolujte súhrn požiadavky, zoznam vozidiel a doplňte poznámku k celej objednávke.",
  },
] as const;

type StepId = (typeof STEPS)[number]["id"];

function toSelected(
  vehicle: Vehicle,
  servicePackage: ServicePackage = "fleet_refresh",
): SelectedRequestVehicle {
  return {
    key: vehicle.id,
    vehicle_id: vehicle.id,
    service_package: servicePackage,
    request_note: "",
    category: vehicle.category,
    license_plate: vehicle.license_plate ?? "",
    vin: vehicle.vin,
    internal_reference: vehicle.internal_reference ?? "",
    brand: vehicle.brand,
    model: vehicle.model,
    make_model: "",
    color: vehicle.color,
  };
}

function createManualVehicle(): SelectedRequestVehicle {
  return {
    key: crypto.randomUUID(),
    vehicle_id: null,
    service_package: "fleet_refresh",
    request_note: "",
    category: null,
    license_plate: "",
    vin: null,
    internal_reference: "",
    brand: null,
    model: null,
    make_model: "",
    color: null,
  };
}

export function NewRequestForm({
  profile,
}: {
  profile: ProfileWithOrganization;
}) {
  const router = useRouter();
  const createRequest = useCreateRequest();
  const [step, setStep] = useState<StepId>(1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const minDate = useMemo(() => earliestRequestDate(), []);
  const minVehicles =
    profile.organization?.min_vehicles_per_request ?? MIN_VEHICLES_PER_DISPATCH;
  const requestSchema = useMemo(
    () => createRequestSchema(minVehicles),
    [minVehicles],
  );

  const form = useForm<CreateRequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      requested_date: minDate,
      requested_time: DEFAULT_REQUEST_TIME,
      priority: "standard",
      partner_note: "",
      vehicles: [],
    },
  });

  const vehicles = useWatch({ control: form.control, name: "vehicles" }) ?? [];
  const requestedDate =
    useWatch({ control: form.control, name: "requested_date" }) ?? minDate;
  const requestedTime =
    useWatch({ control: form.control, name: "requested_time" }) ??
    DEFAULT_REQUEST_TIME;
  const priority =
    useWatch({ control: form.control, name: "priority" }) ?? "standard";
  const partnerNote =
    useWatch({ control: form.control, name: "partner_note" }) ?? "";

  function setVehicles(next: SelectedRequestVehicle[]) {
    form.setValue("vehicles", next, { shouldDirty: true, shouldValidate: true });
  }

  function addFromRegistry(selected: Vehicle[]) {
    const existingIds = new Set(
      vehicles.map((v) => v.vehicle_id).filter(Boolean),
    );
    const additions = selected
      .filter((vehicle) => !existingIds.has(vehicle.id))
      .map((vehicle) => toSelected(vehicle));
    setVehicles([...vehicles, ...additions]);
    if (additions.length > 0) {
      toast.success(
        additions.length === 1
          ? "Vozidlo bolo pridané"
          : `Pridaných vozidiel: ${additions.length}`,
      );
    }
  }

  function addManualVehicle() {
    setVehicles([...vehicles, createManualVehicle()]);
  }

  function removeVehicle(key: string) {
    setVehicles(vehicles.filter((vehicle) => vehicle.key !== key));
  }

  function updateVehicleField<K extends keyof SelectedRequestVehicle>(
    key: string,
    field: K,
    value: SelectedRequestVehicle[K],
  ) {
    setVehicles(
      vehicles.map((vehicle) =>
        vehicle.key === key ? { ...vehicle, [field]: value } : vehicle,
      ),
    );
  }

  async function goNext() {
    if (step === 1) {
      const ok = await form.trigger([
        "requested_date",
        "requested_time",
        "priority",
      ]);
      if (!ok) return;
      setStep(2);
      return;
    }

    if (step === 2) {
      const ok = await form.trigger("vehicles");
      if (!ok) return;
      setStep(3);
    }
  }

  function goBack() {
    if (step === 1) return;
    setStep((current) => (current - 1) as StepId);
  }

  async function onSubmit(data: CreateRequestFormValues) {
    try {
      const payloadVehicles: CreateServiceRequestVehicleInput[] =
        data.vehicles.map((vehicle) => {
          if (vehicle.vehicle_id) {
            return {
              vehicle_id: vehicle.vehicle_id,
              service_package: vehicle.service_package,
              request_note: vehicle.request_note || undefined,
            };
          }

          return {
            license_plate: vehicle.license_plate,
            make_model: vehicle.make_model || undefined,
            internal_reference: vehicle.internal_reference || undefined,
            note: vehicle.request_note || undefined,
            service_package: vehicle.service_package,
          };
        });

      const id = await createRequest.mutateAsync({
        requested_date: data.requested_date,
        requested_time: data.requested_time,
        priority: data.priority,
        partner_note: data.partner_note,
        vehicles: payloadVehicles,
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

  const currentStep = STEPS[step - 1];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          Krok {step} z {STEPS.length}
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text sm:text-3xl">
          {currentStep.title}
        </h1>
        <p className="mt-2 text-sm text-muted">{currentStep.description}</p>
      </header>

      <StepProgress current={step} />

      <form
        onSubmit={(event) => {
          // Never submit the request while navigating between steps.
          // Enter in inputs must only advance / stay on the current step.
          event.preventDefault();
          if (step < 3) {
            void goNext();
          }
        }}
        className="mt-6 space-y-6"
        noValidate
      >
        {step === 1 ? (
          <Panel>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-4">
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

              <div className="flex flex-col gap-4 sm:col-span-2">
                <Label>Čas *</Label>
                <Controller
                  control={form.control}
                  name="requested_time"
                  render={({ field, fieldState }) => (
                    <div>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte čas" />
                        </SelectTrigger>
                        <SelectContent>
                          {REQUEST_TIMES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error ? (
                        <p className="mt-1 text-xs text-rose-300">
                          {fieldState.error.message}
                        </p>
                      ) : null}
                    </div>
                  )}
                />
              </div>

              <div className="flex flex-col gap-4 sm:col-span-3">
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
          </Panel>
        ) : null}

        {step === 2 ? (
          <Panel>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                onClick={() => setPickerOpen(true)}
              >
                Vybrať z evidencie
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11"
                onClick={addManualVehicle}
              >
                <Plus className="h-4 w-4" />
                Pridať vozidlo mimo evidencie
              </Button>
            </div>

            {vehicles.length < minVehicles ? (
              <div
                className={cn(
                  "mb-4 rounded-[10px] border px-3 py-2.5 text-sm",
                  form.formState.errors.vehicles?.message ||
                    form.formState.errors.vehicles?.root?.message
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-200",
                )}
                role="status"
              >
                {form.formState.errors.vehicles?.message ||
                form.formState.errors.vehicles?.root?.message
                  ? form.formState.errors.vehicles?.message ||
                    form.formState.errors.vehicles?.root?.message
                  : `Pridajte aspoň ${minVehicles} vozidlá. Aktuálne: ${vehicles.length}.`}
              </div>
            ) : null}

            {vehicles.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
                Zatiaľ nie sú vybrané žiadne vozidlá.
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle, index) => {
                  const isManual = !vehicle.vehicle_id;
                  const fieldErrors = form.formState.errors.vehicles?.[index];

                  return (
                    <div
                      key={vehicle.key}
                      className="rounded-[12px] border border-border bg-surface-elevated/40 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-text">
                            {isManual
                              ? `Vozidlo ${index + 1}`
                              : `${index + 1}. ${getVehiclePrimaryId(vehicle)}`}
                          </p>
                          {!isManual ? (
                            <>
                              <p className="mt-1 text-sm text-muted">
                                {getVehicleDisplayName(vehicle)}
                              </p>
                              {vehicle.category ? (
                                <div className="mt-2">
                                  <VehicleCategoryBadge
                                    category={vehicle.category}
                                  />
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-muted">
                              Mimo evidencie — údaje len pre túto požiadavku
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Odstrániť vozidlo"
                          onClick={() => removeVehicle(vehicle.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {isManual ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-4">
                            <Label htmlFor={`plate-${vehicle.key}`}>
                              EČV *
                            </Label>
                            <Input
                              id={`plate-${vehicle.key}`}
                              placeholder="BA123AB"
                              value={vehicle.license_plate}
                              onChange={(e) =>
                                updateVehicleField(
                                  vehicle.key,
                                  "license_plate",
                                  normalizeLicensePlate(e.target.value),
                                )
                              }
                              aria-invalid={Boolean(
                                fieldErrors?.license_plate,
                              )}
                            />
                            {fieldErrors?.license_plate?.message ? (
                              <p className="text-xs text-rose-300">
                                {fieldErrors.license_plate.message}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-4">
                            <Label htmlFor={`make-${vehicle.key}`}>
                              Značka a model
                            </Label>
                            <Input
                              id={`make-${vehicle.key}`}
                              placeholder="napr. Škoda Octavia"
                              value={vehicle.make_model}
                              onChange={(e) =>
                                updateVehicleField(
                                  vehicle.key,
                                  "make_model",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-4 sm:col-span-2">
                            <Label htmlFor={`ref-${vehicle.key}`}>
                              Interné označenie / skladové číslo
                            </Label>
                            <Input
                              id={`ref-${vehicle.key}`}
                              placeholder="voliteľné"
                              value={vehicle.internal_reference}
                              onChange={(e) =>
                                updateVehicleField(
                                  vehicle.key,
                                  "internal_reference",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      ) : null}

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-4">
                          <Label>Typ služby *</Label>
                          <Select
                            value={vehicle.service_package}
                            onValueChange={(value) =>
                              updateVehicleField(
                                vehicle.key,
                                "service_package",
                                value as ServicePackage,
                              )
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_PACKAGES.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-4 sm:col-span-2">
                          <Label>Poznámka k vozidlu</Label>
                          <Textarea
                            value={vehicle.request_note}
                            onChange={(e) =>
                              updateVehicleField(
                                vehicle.key,
                                "request_note",
                                e.target.value,
                              )
                            }
                            placeholder="voliteľné"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        ) : null}

        {step === 3 ? (
          <Panel>
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
                label="Čas"
                value={formatTimeSk(requestedTime)}
              />
              <SummaryItem
                label="Priorita"
                value={getPriorityLabel(priority)}
              />
              <SummaryItem
                label="Balíky"
                value={getVehiclesPackageSummary(
                  vehicles.map((v) => ({
                    service_package: v.service_package,
                  })),
                )}
              />
              <SummaryItem
                label="Počet vozidiel"
                value={String(vehicles.length)}
              />
            </dl>

            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-text">Vozidlá</p>
              <ul className="space-y-2">
                {vehicles.map((vehicle, index) => (
                  <li
                    key={vehicle.key}
                    className="rounded-[10px] border border-border bg-surface-elevated/40 px-3 py-2.5 text-sm"
                  >
                    <p className="font-medium text-text">
                      {index + 1}.{" "}
                      {vehicle.vehicle_id
                        ? getVehiclePrimaryId(vehicle)
                        : vehicle.license_plate.trim() || "Bez EČV"}
                    </p>
                    <p className="mt-1 text-muted">
                      {vehicle.vehicle_id
                        ? getVehicleDisplayName(vehicle)
                        : vehicle.make_model.trim() ||
                          "Bez značky / modelu"}{" "}
                      · {getPackageLabel(vehicle.service_package)}
                    </p>
                    {vehicle.request_note.trim() ? (
                      <p className="mt-1 text-xs text-muted">
                        Poznámka: {vehicle.request_note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <Label htmlFor="partner_note">Poznámka k celej objednávke</Label>
              <Controller
                control={form.control}
                name="partner_note"
                render={({ field }) => (
                  <Textarea
                    id="partner_note"
                    placeholder="Napr. prístup do areálu, kontakt na mieste…"
                    {...field}
                  />
                )}
              />
              {partnerNote.trim() ? null : (
                <p className="text-xs text-muted">Voliteľné</p>
              )}
            </div>

            <p className="mt-5 text-sm text-amber-200/90">
              {TERM_VALIDITY_NOTICE}
            </p>
          </Panel>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            onClick={goBack}
            disabled={step === 1 || createRequest.isPending}
          >
            <ChevronLeft className="h-4 w-4" />
            Späť
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              size="lg"
              className="min-h-12 w-full sm:w-auto"
              onClick={() => void goNext()}
            >
              Pokračovať
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="min-h-12 w-full sm:w-auto"
              disabled={createRequest.isPending || form.formState.isSubmitting}
              onClick={() => void form.handleSubmit(onSubmit)()}
            >
              {createRequest.isPending ? "Odosielam…" : "Odoslať požiadavku"}
            </Button>
          )}
        </div>
      </form>

      <VehiclePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedIds={vehicles
          .map((v) => v.vehicle_id)
          .filter((id): id is string => Boolean(id))}
        onConfirm={addFromRegistry}
      />
    </div>
  );
}

function StepProgress({ current }: { current: StepId }) {
  const progress = (current / STEPS.length) * 100;

  return (
    <nav aria-label="Kroky požiadavky" className="space-y-3">
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="flex items-start justify-between gap-2">
        {STEPS.map((item) => {
          const active = item.id === current;
          const done = item.id < current;
          return (
            <li key={item.id} className="min-w-0 flex-1 text-center">
              <p
                className={cn(
                  "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                  active && "bg-accent text-background",
                  done && "bg-accent/20 text-accent",
                  !active && !done && "bg-surface-elevated text-muted",
                )}
              >
                {item.id}
              </p>
              <p
                className={cn(
                  "mt-1.5 truncate text-xs font-medium sm:text-sm",
                  active || done ? "text-text" : "text-muted",
                )}
              >
                {item.label}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[12px] border border-border bg-surface p-5 sm:p-6">
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

"use client";

import { type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { VEHICLE_CATEGORIES } from "@/config/constants";
import {
  vehicleFormSchema,
  vehicleFormToInput,
  type VehicleFormValues,
} from "@/schemas/vehicle";
import { cn, normalizeLicensePlate } from "@/lib/utils";
import type { Vehicle, VehicleInput } from "@/types";

type VehicleFormProps = {
  initialVehicle?: Vehicle | null;
  defaultCategory?: VehicleFormValues["category"];
  submitLabel?: string;
  onSubmit: (input: VehicleInput) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

export function VehicleForm({
  initialVehicle,
  defaultCategory = "rental",
  submitLabel = "Uložiť vozidlo",
  onSubmit,
  onCancel,
  isSubmitting = false,
}: VehicleFormProps) {
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      category: initialVehicle?.category ?? defaultCategory,
      license_plate: initialVehicle?.license_plate ?? "",
      vin: initialVehicle?.vin ?? "",
      internal_reference: initialVehicle?.internal_reference ?? "",
      brand: initialVehicle?.brand ?? "",
      model: initialVehicle?.model ?? "",
      year: initialVehicle?.year != null ? String(initialVehicle.year) : "",
      color: initialVehicle?.color ?? "",
      assigned_person: initialVehicle?.assigned_person ?? "",
      notes: initialVehicle?.notes ?? "",
    },
  });

  const category = useWatch({ control: form.control, name: "category" });

  async function handleSubmit(values: VehicleFormValues) {
    await onSubmit(vehicleFormToInput(values));
  }

  return (
    <form
      className="space-y-5"
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
    >
      <div className="space-y-2">
        <Label>Kategória *</Label>
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Vyberte kategóriu" />
              </SelectTrigger>
              <SelectContent>
                {VEHICLE_CATEGORIES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="EČV"
          htmlFor="license_plate"
          emphasized={category === "for_sale"}
          error={form.formState.errors.license_plate?.message}
        >
          <Controller
            control={form.control}
            name="license_plate"
            render={({ field }) => (
              <Input
                id="license_plate"
                placeholder="BA123AB"
                value={field.value}
                onChange={(e) =>
                  field.onChange(normalizeLicensePlate(e.target.value))
                }
                onBlur={field.onBlur}
              />
            )}
          />
        </Field>

        <Field
          label="VIN"
          htmlFor="vin"
          emphasized={category === "for_sale"}
          error={form.formState.errors.vin?.message}
        >
          <Controller
            control={form.control}
            name="vin"
            render={({ field }) => (
              <Input
                id="vin"
                placeholder="WVWZZZ..."
                value={field.value}
                onChange={(e) =>
                  field.onChange(e.target.value.toUpperCase())
                }
                onBlur={field.onBlur}
              />
            )}
          />
        </Field>

        <Field
          label="Interné označenie / číslo vozidla"
          htmlFor="internal_reference"
          emphasized={category === "rental"}
          error={form.formState.errors.internal_reference?.message}
          className="sm:col-span-2"
        >
          <Input id="internal_reference" {...form.register("internal_reference")} />
        </Field>

        <Field label="Značka" htmlFor="brand">
          <Input id="brand" placeholder="Škoda" {...form.register("brand")} />
        </Field>

        <Field label="Model" htmlFor="model">
          <Input id="model" placeholder="Octavia" {...form.register("model")} />
        </Field>

        <Field
          label="Rok výroby"
          htmlFor="year"
          error={form.formState.errors.year?.message}
        >
          <Input
            id="year"
            type="number"
            inputMode="numeric"
            placeholder="2022"
            {...form.register("year")}
          />
        </Field>

        <Field label="Farba" htmlFor="color">
          <Input id="color" {...form.register("color")} />
        </Field>

        <Field
          label="Priradená osoba"
          htmlFor="assigned_person"
          emphasized={category === "staff"}
          className="sm:col-span-2"
        >
          <Input
            id="assigned_person"
            placeholder={
              category === "staff" ? "Meno zamestnanca" : "voliteľné"
            }
            {...form.register("assigned_person")}
          />
        </Field>

        <Field label="Poznámka" htmlFor="notes" className="sm:col-span-2">
          <Textarea id="notes" {...form.register("notes")} />
        </Field>
      </div>

      <p className="text-xs text-muted">
        Povinné je aspoň jedno z polí EČV, VIN alebo interné označenie.
      </p>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Zrušiť
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting} className="min-h-11">
          {isSubmitting ? "Ukladám…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  emphasized,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  emphasized?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label
        htmlFor={htmlFor}
        className={emphasized ? "text-accent" : undefined}
      >
        {label}
        {emphasized ? " · odporúčané" : ""}
      </Label>
      {children}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}

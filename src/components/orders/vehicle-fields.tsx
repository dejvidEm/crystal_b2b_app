"use client";

import type { Control, FieldArrayWithId } from "react-hook-form";
import { Controller } from "react-hook-form";
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
import { SERVICE_PACKAGES } from "@/config/constants";
import type { CreateRequestFormValues } from "@/schemas/request";
import { normalizeLicensePlate } from "@/lib/utils";

export function VehicleFields({
  control,
  fields,
}: {
  control: Control<CreateRequestFormValues>;
  fields: FieldArrayWithId<CreateRequestFormValues, "vehicles", "id">[];
}) {
  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="rounded-[12px] border border-border bg-surface p-4"
        >
          <p className="mb-3 text-sm font-medium text-text">
            Vozidlo {index + 1}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`vehicles.${index}.license_plate`}>EČV *</Label>
              <Controller
                control={control}
                name={`vehicles.${index}.license_plate`}
                render={({ field: f, fieldState }) => (
                  <div>
                    <Input
                      id={`vehicles.${index}.license_plate`}
                      placeholder="BA123AB"
                      value={f.value}
                      onChange={(e) =>
                        f.onChange(normalizeLicensePlate(e.target.value))
                      }
                      onBlur={f.onBlur}
                      aria-invalid={Boolean(fieldState.error)}
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

            <div className="space-y-2">
              <Label htmlFor={`vehicles.${index}.service_package`}>
                Typ služby *
              </Label>
              <Controller
                control={control}
                name={`vehicles.${index}.service_package`}
                render={({ field: f, fieldState }) => (
                  <div>
                    <Select value={f.value} onValueChange={f.onChange}>
                      <SelectTrigger
                        id={`vehicles.${index}.service_package`}
                        aria-invalid={Boolean(fieldState.error)}
                      >
                        <SelectValue placeholder="Vyberte balík" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_PACKAGES.map((option) => (
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

            <div className="space-y-2">
              <Label htmlFor={`vehicles.${index}.make_model`}>
                Značka a model
              </Label>
              <Controller
                control={control}
                name={`vehicles.${index}.make_model`}
                render={({ field: f }) => (
                  <Input
                    id={`vehicles.${index}.make_model`}
                    placeholder="napr. Škoda Octavia"
                    {...f}
                  />
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`vehicles.${index}.internal_reference`}>
                Interné označenie / skladové číslo
              </Label>
              <Controller
                control={control}
                name={`vehicles.${index}.internal_reference`}
                render={({ field: f }) => (
                  <Input
                    id={`vehicles.${index}.internal_reference`}
                    placeholder="voliteľné"
                    {...f}
                  />
                )}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={`vehicles.${index}.note`}>Poznámka k vozidlu</Label>
              <Controller
                control={control}
                name={`vehicles.${index}.note`}
                render={({ field: f }) => (
                  <Textarea
                    id={`vehicles.${index}.note`}
                    placeholder="voliteľné"
                    {...f}
                  />
                )}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

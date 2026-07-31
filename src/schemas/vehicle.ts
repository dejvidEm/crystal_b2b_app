import { z } from "zod";

const currentYear = new Date(
  new Date().toLocaleString("en-US", { timeZone: "Europe/Bratislava" }),
).getFullYear();

export const vehicleFormSchema = z
  .object({
    category: z.enum(["rental", "staff", "for_sale"], {
      required_error: "Vyberte kategóriu",
    }),
    license_plate: z.string(),
    vin: z.string(),
    internal_reference: z.string(),
    brand: z.string(),
    model: z.string(),
    year: z.string(),
    color: z.string(),
    assigned_person: z.string(),
    notes: z.string(),
  })
  .superRefine((data, ctx) => {
    const plate = data.license_plate.trim();
    const vin = data.vin.trim();
    const internal = data.internal_reference.trim();

    if (!plate && !vin && !internal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Zadajte EČV, VIN alebo interné označenie",
        path: ["license_plate"],
      });
    }

    const yearRaw = data.year.trim();
    if (yearRaw) {
      const parsed = Number(yearRaw);
      if (
        !Number.isFinite(parsed) ||
        parsed < 1980 ||
        parsed > currentYear + 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Rok výroby musí byť medzi 1980 a ${currentYear + 1}`,
          path: ["year"],
        });
      }
    }
  });

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export function vehicleFormToInput(values: VehicleFormValues) {
  const yearRaw = values.year.trim();
  return {
    category: values.category,
    license_plate: values.license_plate.trim() || undefined,
    vin: values.vin.trim().toUpperCase() || undefined,
    internal_reference: values.internal_reference.trim() || undefined,
    brand: values.brand.trim() || undefined,
    model: values.model.trim() || undefined,
    year: yearRaw ? Number(yearRaw) : null,
    color: values.color.trim() || undefined,
    assigned_person: values.assigned_person.trim() || undefined,
    notes: values.notes.trim() || undefined,
  };
}

import { z } from "zod";
import {
  MAX_VEHICLES_PER_DISPATCH,
  MIN_VEHICLES_PER_DISPATCH,
} from "@/config/constants";
import { earliestRequestDate } from "@/lib/utils";

const servicePackageEnum = z.enum(
  ["fleet_refresh", "fleet_interior_care", "vehicle_turnover"],
  { required_error: "Vyberte typ služby" },
);

export const selectedRequestVehicleSchema = z
  .object({
    key: z.string(),
    vehicle_id: z.string().uuid().nullable(),
    service_package: servicePackageEnum,
    request_note: z.string(),
    category: z.enum(["rental", "staff", "for_sale"]).nullable(),
    license_plate: z.string(),
    vin: z.string().nullable(),
    internal_reference: z.string(),
    brand: z.string().nullable(),
    model: z.string().nullable(),
    make_model: z.string(),
    color: z.string().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.vehicle_id) return;

    if (!data.license_plate.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EČV je povinné",
        path: ["license_plate"],
      });
    }
  });

export function createRequestSchema(
  minVehicles: number = MIN_VEHICLES_PER_DISPATCH,
) {
  const minimum = Math.max(1, Math.min(MAX_VEHICLES_PER_DISPATCH, minVehicles));

  return z
    .object({
      requested_date: z.string().min(1, "Dátum je povinný"),
      requested_time: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Vyberte platný čas"),
      priority: z.enum(["standard", "priority"], {
        required_error: "Vyberte prioritu",
      }),
      partner_note: z.string(),
      vehicles: z.array(selectedRequestVehicleSchema),
    })
    .superRefine((data, ctx) => {
      const earliest = earliestRequestDate();
      if (data.requested_date < earliest) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Požiadavku je potrebné odoslať aspoň jeden deň vopred",
          path: ["requested_date"],
        });
      }

      if (data.vehicles.length < minimum) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Vyberte aspoň ${minimum} vozidlá`,
          path: ["vehicles"],
        });
      }

      if (data.vehicles.length > MAX_VEHICLES_PER_DISPATCH) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Maximálny počet vozidiel je ${MAX_VEHICLES_PER_DISPATCH}`,
          path: ["vehicles"],
        });
      }

      const ids = data.vehicles
        .map((v) => v.vehicle_id)
        .filter((id): id is string => Boolean(id));
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "To isté vozidlo nemôže byť v požiadavke viackrát",
          path: ["vehicles"],
        });
      }
    });
}

export type CreateRequestFormValues = z.infer<
  ReturnType<typeof createRequestSchema>
>;
export type SelectedRequestVehicle = z.infer<
  typeof selectedRequestVehicleSchema
>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail je povinný")
    .email("Zadajte platný e-mail"),
  password: z.string().min(1, "Heslo je povinné"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

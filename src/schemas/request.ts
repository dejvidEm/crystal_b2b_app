import { z } from "zod";
import {
  MAX_VEHICLES_PER_DISPATCH,
  MIN_VEHICLES_PER_DISPATCH,
} from "@/config/constants";
import { earliestRequestDate, normalizeLicensePlate } from "@/lib/utils";

const servicePackageEnum = z.enum(
  ["fleet_refresh", "fleet_interior_care", "vehicle_turnover"],
  { required_error: "Vyberte typ služby" },
);

export const vehicleSchema = z.object({
  license_plate: z
    .string()
    .min(1, "EČV je povinné")
    .transform(normalizeLicensePlate),
  make_model: z.string(),
  internal_reference: z.string(),
  note: z.string(),
  service_package: servicePackageEnum,
});

export const createRequestSchema = z
  .object({
    requested_date: z.string().min(1, "Dátum je povinný"),
    time_window: z.enum(["morning", "afternoon", "flexible"], {
      required_error: "Vyberte časové okno",
    }),
    /** UI helper: default package applied via "Použiť pre všetky". */
    default_package: servicePackageEnum,
    priority: z.enum(["standard", "priority"], {
      required_error: "Vyberte prioritu",
    }),
    partner_note: z.string(),
    vehicle_count: z
      .number()
      .int()
      .min(
        MIN_VEHICLES_PER_DISPATCH,
        `Minimálny počet vozidiel je ${MIN_VEHICLES_PER_DISPATCH}`,
      )
      .max(
        MAX_VEHICLES_PER_DISPATCH,
        `Maximálny počet vozidiel je ${MAX_VEHICLES_PER_DISPATCH}`,
      ),
    vehicles: z.array(vehicleSchema),
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

    if (data.vehicles.length !== data.vehicle_count) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Počet riadkov vozidiel musí zodpovedať zvolenému počtu",
        path: ["vehicles"],
      });
    }

    data.vehicles.forEach((vehicle, index) => {
      if (!vehicle.license_plate.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "EČV je povinné",
          path: ["vehicles", index, "license_plate"],
        });
      }
    });
  });

export type CreateRequestFormValues = z.infer<typeof createRequestSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-mail je povinný")
    .email("Zadajte platný e-mail"),
  password: z.string().min(1, "Heslo je povinné"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

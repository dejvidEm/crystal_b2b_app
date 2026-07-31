import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { sk } from "date-fns/locale";
import {
  PRIORITIES,
  REQUEST_STATUSES,
  SERVICE_PACKAGES,
  TIMEZONE,
  VEHICLE_CATEGORIES,
} from "@/config/constants";
import type {
  RequestPriority,
  RequestStatus,
  ServicePackage,
  VehicleCategory,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Current calendar date in Europe/Bratislava as YYYY-MM-DD. */
export function todayInBratislava(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Earliest selectable request date (tomorrow in Bratislava). */
export function earliestRequestDate(): string {
  const today = todayInBratislava();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function formatDateSk(date: string | Date): string {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "d. M. yyyy", { locale: sk });
}

export function formatDateTimeSk(date: string | Date): string {
  const value = typeof date === "string" ? parseISO(date) : date;
  return format(value, "d. M. yyyy HH:mm", { locale: sk });
}

export function formatMonthYearSk(date: Date): string {
  return format(date, "LLLL yyyy", { locale: sk });
}

export function getStatusLabel(status: RequestStatus): string {
  return REQUEST_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function getPackageLabel(value: ServicePackage): string {
  return SERVICE_PACKAGES.find((p) => p.value === value)?.label ?? value;
}

export function getVehicleCategoryLabel(value: VehicleCategory): string {
  return VEHICLE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export function getVehicleCategoryShortLabel(value: VehicleCategory): string {
  return (
    VEHICLE_CATEGORIES.find((c) => c.value === value)?.shortLabel ?? value
  );
}

export function getVehiclePrimaryId(vehicle: {
  license_plate?: string | null;
  vin?: string | null;
  internal_reference?: string | null;
}): string {
  return (
    vehicle.license_plate?.trim() ||
    vehicle.vin?.trim() ||
    vehicle.internal_reference?.trim() ||
    "Bez identifikátora"
  );
}

export function getVehicleDisplayName(vehicle: {
  brand?: string | null;
  model?: string | null;
  make_model?: string | null;
}): string {
  const combined = [vehicle.brand, vehicle.model]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  if (combined) return combined;
  return vehicle.make_model?.trim() || "Bez značky / modelu";
}

/** Summary for request-level package (null = mixed packages). */
export function getRequestPackageLabel(
  value: ServicePackage | null | undefined,
): string {
  if (!value) return "Zmiešané balíky";
  return getPackageLabel(value);
}

/** Compact multi-package summary, e.g. "2× Fleet Refresh, 1× Vehicle Turnover". */
export function getVehiclesPackageSummary(
  vehicles: Array<{ service_package: ServicePackage }>,
): string {
  if (vehicles.length === 0) return "—";

  const counts = new Map<ServicePackage, number>();
  for (const vehicle of vehicles) {
    counts.set(
      vehicle.service_package,
      (counts.get(vehicle.service_package) ?? 0) + 1,
    );
  }

  if (counts.size === 1) {
    const only = vehicles[0]?.service_package;
    return only ? getPackageLabel(only) : "—";
  }

  return Array.from(counts.entries())
    .map(([pkg, count]) => `${count}× ${getPackageLabel(pkg)}`)
    .join(", ");
}

/** Formats DB/time input values like "09:00:00" or "09:00" for display. */
export function formatTimeSk(value: string | null | undefined): string {
  if (!value) return "—";
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

/** Normalize to HH:mm for form values and RPC payloads. */
export function toRequestTime(value: string | null | undefined): string {
  const formatted = formatTimeSk(value);
  return formatted === "—" ? "09:00" : formatted;
}

export function getPriorityLabel(value: RequestPriority): string {
  return PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

export function getStatusColorClasses(status: RequestStatus): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/15 text-amber-300 border-amber-500/30";
    case "confirmed":
      return "bg-sky-400/15 text-sky-300 border-sky-400/30";
    case "in_progress":
      return "bg-violet-500/15 text-violet-300 border-violet-500/30";
    case "completed":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    case "rejected":
    case "cancelled":
      return "bg-rose-500/10 text-rose-300/80 border-rose-500/20";
    default:
      return "bg-white/5 text-muted border-border";
  }
}

export function getCalendarEventColor(status: RequestStatus): string {
  switch (status) {
    case "pending":
      return "border-l-amber-400 bg-amber-500/10";
    case "confirmed":
      return "border-l-sky-400 bg-sky-400/10";
    case "in_progress":
      return "border-l-violet-400 bg-violet-500/10";
    case "completed":
      return "border-l-emerald-400 bg-emerald-500/10";
    case "rejected":
    case "cancelled":
      return "border-l-rose-400/60 bg-rose-500/5";
    default:
      return "border-l-white/20 bg-white/5";
  }
}

export function normalizeLicensePlate(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, " ");
}

export function getMonthMatrix(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start, end });
}

export function getMonthRangeIso(month: Date) {
  return {
    from: format(startOfMonth(month), "yyyy-MM-dd"),
    to: format(endOfMonth(month), "yyyy-MM-dd"),
  };
}

export {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  sk,
};

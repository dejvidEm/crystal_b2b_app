import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Vehicle,
  VehicleInput,
  VehicleListFilters,
} from "@/types";

export const VEHICLE_COLUMNS =
  "id, organization_id, created_by, category, license_plate, vin, internal_reference, brand, model, year, color, assigned_person, notes, is_active, created_at, updated_at";

function mapDuplicateError(message: string): string {
  if (
    message.includes("vehicles_org_plate_active_uidx") ||
    message.toLowerCase().includes("license_plate")
  ) {
    return "Aktívne vozidlo s týmto EČV už v evidencii existuje.";
  }
  if (
    message.includes("vehicles_org_vin_active_uidx") ||
    message.toLowerCase().includes("vin")
  ) {
    return "Aktívne vozidlo s týmto VIN už v evidencii existuje.";
  }
  if (
    message.includes("vehicles_org_internal_active_uidx") ||
    message.toLowerCase().includes("internal")
  ) {
    return "Aktívne vozidlo s týmto interným označením už existuje.";
  }
  if (message.toLowerCase().includes("unique") || message.toLowerCase().includes("duplicate")) {
    return "Vozidlo s týmto identifikátorom už v evidencii existuje.";
  }
  return message;
}

export async function fetchVehicles(
  supabase: SupabaseClient,
  filters: VehicleListFilters = {},
): Promise<Vehicle[]> {
  let query = supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(500);

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters.status === "active" || !filters.status) {
    query = query.eq("is_active", true);
  } else if (filters.status === "archived") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let vehicles = (data ?? []) as Vehicle[];
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    vehicles = vehicles.filter((vehicle) => {
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
      return haystack.includes(search);
    });
  }

  return vehicles;
}

export async function fetchActiveVehicles(
  supabase: SupabaseClient,
): Promise<Vehicle[]> {
  return fetchVehicles(supabase, { status: "active" });
}

export async function createVehicle(
  supabase: SupabaseClient,
  input: VehicleInput,
  organizationId: string,
  createdBy: string,
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      organization_id: organizationId,
      created_by: createdBy,
      category: input.category,
      license_plate: input.license_plate ?? null,
      vin: input.vin ?? null,
      internal_reference: input.internal_reference ?? null,
      brand: input.brand ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      color: input.color ?? null,
      assigned_person: input.assigned_person ?? null,
      notes: input.notes ?? null,
      is_active: true,
    })
    .select(VEHICLE_COLUMNS)
    .single();

  if (error) throw new Error(mapDuplicateError(error.message));
  return data as Vehicle;
}

export async function updateVehicle(
  supabase: SupabaseClient,
  id: string,
  input: VehicleInput,
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .update({
      category: input.category,
      license_plate: input.license_plate ?? null,
      vin: input.vin ?? null,
      internal_reference: input.internal_reference ?? null,
      brand: input.brand ?? null,
      model: input.model ?? null,
      year: input.year ?? null,
      color: input.color ?? null,
      assigned_person: input.assigned_person ?? null,
      notes: input.notes ?? null,
    })
    .eq("id", id)
    .select(VEHICLE_COLUMNS)
    .single();

  if (error) throw new Error(mapDuplicateError(error.message));
  return data as Vehicle;
}

export async function setVehicleActive(
  supabase: SupabaseClient,
  id: string,
  isActive: boolean,
): Promise<Vehicle> {
  const { data, error } = await supabase
    .from("vehicles")
    .update({ is_active: isActive })
    .eq("id", id)
    .select(VEHICLE_COLUMNS)
    .single();

  if (error) throw new Error(mapDuplicateError(error.message));
  return data as Vehicle;
}

export async function fetchVehicleById(
  supabase: SupabaseClient,
  id: string,
): Promise<Vehicle | null> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(VEHICLE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Vehicle | null) ?? null;
}

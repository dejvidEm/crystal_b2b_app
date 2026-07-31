import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organization } from "@/types";

const ORGANIZATION_COLUMNS =
  "id, name, company_id, billing_email, phone, service_address, is_active, min_vehicles_per_request, created_at, updated_at";

export async function fetchOrganizations(
  supabase: SupabaseClient,
): Promise<Organization[]> {
  const { data, error } = await supabase
    .from("organizations")
    .select(ORGANIZATION_COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Organization[];
}

export async function updateOrganizationMinVehicles(
  supabase: SupabaseClient,
  organizationId: string,
  minVehicles: number,
): Promise<void> {
  const { error } = await supabase.rpc("update_organization_min_vehicles", {
    p_organization_id: organizationId,
    p_min_vehicles: minVehicles,
  });

  if (error) {
    throw new Error(error.message);
  }
}

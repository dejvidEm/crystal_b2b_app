import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateServiceRequestInput,
  DashboardStats,
  ProfileWithOrganization,
  RequestStatus,
  ServiceRequestDetail,
  ServiceRequestListItem,
} from "@/types";
import { todayInBratislava } from "@/lib/utils";

const PROFILE_COLUMNS =
  "id, organization_id, role, full_name, is_active, created_at, updated_at, organization:organizations(id, name, service_address, is_active, min_vehicles_per_request)";

const REQUEST_LIST_COLUMNS =
  "id, reference_code, organization_id, requested_date, requested_time, service_package, priority, vehicle_count, status, created_at, organization:organizations(id, name)";

const REQUEST_DETAIL_COLUMNS =
  "id, reference_code, organization_id, created_by, requested_date, requested_time, service_package, priority, vehicle_count, status, partner_note, admin_note, confirmed_at, started_at, completed_at, created_at, updated_at, organization:organizations(id, name, service_address, phone), vehicles:request_vehicles(id, request_id, vehicle_id, category, license_plate, vin, make_model, brand, model, color, internal_reference, note, service_package, sort_order, created_at)";

function unwrapRelation<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapListItem(row: Record<string, unknown>): ServiceRequestListItem {
  return {
    id: row.id as string,
    reference_code: row.reference_code as string,
    organization_id: row.organization_id as string,
    requested_date: row.requested_date as string,
    requested_time: row.requested_time as ServiceRequestListItem["requested_time"],
    service_package:
      row.service_package as ServiceRequestListItem["service_package"],
    priority: row.priority as ServiceRequestListItem["priority"],
    vehicle_count: row.vehicle_count as number,
    status: row.status as ServiceRequestListItem["status"],
    created_at: row.created_at as string,
    organization: unwrapRelation(
      row.organization as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null,
    ),
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
): Promise<ProfileWithOrganization | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    organization: unwrapRelation(
      data.organization as ProfileWithOrganization["organization"] | ProfileWithOrganization["organization"][] | null,
    ),
  } as ProfileWithOrganization;
}

export async function fetchRequests(
  supabase: SupabaseClient,
  options?: {
    status?: RequestStatus;
    limit?: number;
  },
): Promise<ServiceRequestListItem[]> {
  let query = supabase
    .from("service_requests")
    .select(REQUEST_LIST_COLUMNS)
    .order("requested_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapListItem(row as Record<string, unknown>));
}

export async function fetchCalendarRequests(
  supabase: SupabaseClient,
  from: string,
  to: string,
): Promise<ServiceRequestListItem[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select(REQUEST_LIST_COLUMNS)
    .gte("requested_date", from)
    .lte("requested_date", to)
    .order("requested_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapListItem(row as Record<string, unknown>));
}

export async function fetchRequestDetail(
  supabase: SupabaseClient,
  id: string,
): Promise<ServiceRequestDetail | null> {
  const { data, error } = await supabase
    .from("service_requests")
    .select(REQUEST_DETAIL_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const vehicles = Array.isArray(data.vehicles)
    ? [...data.vehicles].sort(
        (a, b) =>
          (a as { sort_order: number }).sort_order -
          (b as { sort_order: number }).sort_order,
      )
    : [];

  return {
    ...(data as unknown as ServiceRequestDetail),
    organization: unwrapRelation(
      data.organization as ServiceRequestDetail["organization"] | ServiceRequestDetail["organization"][] | null,
    ),
    vehicles: vehicles as ServiceRequestDetail["vehicles"],
  };
}

export async function createServiceRequest(
  supabase: SupabaseClient,
  input: CreateServiceRequestInput,
): Promise<string> {
  const { data, error } = await supabase.rpc("create_service_request", {
    p_requested_date: input.requested_date,
    p_requested_time: input.requested_time,
    p_priority: input.priority,
    p_partner_note: input.partner_note ?? null,
    p_vehicles: input.vehicles,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

export async function updateRequestStatus(
  supabase: SupabaseClient,
  requestId: string,
  newStatus: RequestStatus,
  adminNote?: string,
): Promise<void> {
  const { error } = await supabase.rpc("update_request_status", {
    p_request_id: requestId,
    p_new_status: newStatus,
    p_admin_note: adminNote ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchDashboardStats(
  supabase: SupabaseClient,
  role: "admin" | "partner",
): Promise<DashboardStats> {
  const today = todayInBratislava();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [y, m] = today.split("-").map(Number);
  const nextMonth =
    m === 12
      ? `${y + 1}-01-01`
      : `${y}-${String(m + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("service_requests")
    .select(REQUEST_LIST_COLUMNS)
    .order("requested_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const requests = (data ?? []).map((row) =>
    mapListItem(row as Record<string, unknown>),
  );

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const confirmedUpcoming = requests.filter(
    (r) => r.status === "confirmed" && r.requested_date >= today,
  );
  const completed = requests.filter((r) => r.status === "completed");
  const vehiclesThisMonth = requests
    .filter(
      (r) =>
        r.requested_date >= monthStart &&
        r.requested_date < nextMonth &&
        ["confirmed", "in_progress", "completed"].includes(r.status),
    )
    .reduce((sum, r) => sum + r.vehicle_count, 0);

  const nextConfirmed =
    [...confirmedUpcoming].sort((a, b) =>
      a.requested_date.localeCompare(b.requested_date),
    )[0] ?? null;

  return {
    pendingCount: pendingRequests.length,
    confirmedUpcomingCount: confirmedUpcoming.length,
    vehiclesThisMonth,
    completedCount: completed.length,
    nextConfirmed,
    recentRequests: requests.slice(0, 8),
    pendingRequests: role === "admin" ? pendingRequests.slice(0, 8) : [],
  };
}

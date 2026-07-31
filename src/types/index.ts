export type UserRole = "admin" | "partner";

export type RequestStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "rejected"
  | "cancelled";

export type ServicePackage =
  | "fleet_refresh"
  | "fleet_interior_care"
  | "vehicle_turnover";

export type TimeWindow = "morning" | "afternoon" | "flexible";

export type RequestPriority = "standard" | "priority";

export type Organization = {
  id: string;
  name: string;
  company_id: string | null;
  billing_email: string | null;
  phone: string | null;
  service_address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  organization_id: string | null;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileWithOrganization = Profile & {
  organization: Pick<
    Organization,
    "id" | "name" | "service_address" | "is_active"
  > | null;
};

export type ServiceRequest = {
  id: string;
  reference_code: string;
  organization_id: string;
  created_by: string;
  requested_date: string;
  time_window: TimeWindow;
  /** Same package for all vehicles, or null when mixed. */
  service_package: ServicePackage | null;
  priority: RequestPriority;
  vehicle_count: number;
  status: RequestStatus;
  partner_note: string | null;
  admin_note: string | null;
  confirmed_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RequestVehicle = {
  id: string;
  request_id: string;
  license_plate: string;
  make_model: string | null;
  internal_reference: string | null;
  note: string | null;
  service_package: ServicePackage;
  sort_order: number;
  created_at: string;
};

export type ServiceRequestListItem = Pick<
  ServiceRequest,
  | "id"
  | "reference_code"
  | "organization_id"
  | "requested_date"
  | "time_window"
  | "service_package"
  | "priority"
  | "vehicle_count"
  | "status"
  | "created_at"
> & {
  organization: Pick<Organization, "id" | "name"> | null;
};

export type ServiceRequestDetail = ServiceRequest & {
  organization: Pick<
    Organization,
    "id" | "name" | "service_address" | "phone"
  > | null;
  vehicles: RequestVehicle[];
};

export type CreateServiceRequestVehicleInput = {
  license_plate: string;
  make_model?: string;
  internal_reference?: string;
  note?: string;
  service_package: ServicePackage;
};

export type CreateServiceRequestInput = {
  requested_date: string;
  time_window: TimeWindow;
  priority: RequestPriority;
  partner_note?: string;
  vehicles: CreateServiceRequestVehicleInput[];
};

export type DashboardStats = {
  pendingCount: number;
  confirmedUpcomingCount: number;
  vehiclesThisMonth: number;
  completedCount: number;
  nextConfirmed: ServiceRequestListItem | null;
  recentRequests: ServiceRequestListItem[];
  pendingRequests: ServiceRequestListItem[];
};

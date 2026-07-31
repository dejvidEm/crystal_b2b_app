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

export type RequestPriority = "standard" | "priority";

export type VehicleCategory = "rental" | "staff" | "for_sale";

export type Organization = {
  id: string;
  name: string;
  company_id: string | null;
  billing_email: string | null;
  phone: string | null;
  service_address: string;
  is_active: boolean;
  min_vehicles_per_request: number;
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
    | "id"
    | "name"
    | "service_address"
    | "is_active"
    | "min_vehicles_per_request"
  > | null;
};

export type ServiceRequest = {
  id: string;
  reference_code: string;
  organization_id: string;
  created_by: string;
  requested_date: string;
  requested_time: string;
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

export type Vehicle = {
  id: string;
  organization_id: string;
  created_by: string;
  category: VehicleCategory;
  license_plate: string | null;
  vin: string | null;
  internal_reference: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  assigned_person: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleInput = {
  category: VehicleCategory;
  license_plate?: string;
  vin?: string;
  internal_reference?: string;
  brand?: string;
  model?: string;
  year?: number | null;
  color?: string;
  assigned_person?: string;
  notes?: string;
};

export type RequestVehicle = {
  id: string;
  request_id: string;
  vehicle_id: string | null;
  category: VehicleCategory | null;
  license_plate: string | null;
  vin: string | null;
  make_model: string | null;
  brand: string | null;
  model: string | null;
  color: string | null;
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
  | "requested_time"
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

export type CreateServiceRequestVehicleInput =
  | {
      vehicle_id: string;
      service_package: ServicePackage;
      request_note?: string;
    }
  | {
      new_vehicle: VehicleInput;
      service_package: ServicePackage;
      request_note?: string;
    }
  | {
      license_plate: string;
      make_model?: string;
      internal_reference?: string;
      note?: string;
      service_package: ServicePackage;
    };

export type CreateServiceRequestInput = {
  requested_date: string;
  requested_time: string;
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

export type VehicleListFilters = {
  category?: VehicleCategory | "all";
  status?: "active" | "archived" | "all";
  search?: string;
};

// Each lookup row carries `id` (BIGINT serialized as string) + a code/label.
// Suppliers and manufacturers are name-keyed instead of code-keyed.

export type CategoryLookup     = { id: string; code: string; label: string; isMaintenance: boolean; parentId: string | null };
export type UnitLookup         = { id: string; code: string; label: string; symbol: string | null };
export type SupplierLookup     = { id: string; name: string; isActive: boolean };
export type ManufacturerLookup = { id: string; name: string };
export type DepartmentLookup   = { id: string; code: string; label: string };
export type RegionLookup       = { id: string; code: string; label: string };
export type SiteLookup         = { id: string; code: string; label: string; regionId: string | null };
export type StorageLookup      = { id: string; code: string; label: string };
export type RoleLookup         = { id: string; code: string; label: string; isAdmin: boolean };

export type Lookups = {
  categories:       CategoryLookup[];
  units:            UnitLookup[];
  suppliers:        SupplierLookup[];
  manufacturers:    ManufacturerLookup[];
  departments:      DepartmentLookup[];
  regions:          RegionLookup[];
  sites:            SiteLookup[];
  storageLocations: StorageLookup[];
  roles:            RoleLookup[];
};

// ─── Supplier (full record) ─────────────────────────────────────────

export type SupplierRow = {
  id:          string;
  name:        string;
  contactName: string | null;
  email:       string | null;
  phone:       string | null;
  address:     string | null;
  isActive:    boolean;
  createdAt:   string;
};

export type SuppliersListResponse = {
  data:   SupplierRow[];
  total:  number;
  limit:  number;
  offset: number;
};

export type CreateSupplierPayload = {
  name:         string;
  contactName?: string | null;
  email?:       string | null;
  phone?:       string | null;
  address?:     string | null;
  isActive?:    boolean;
};

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>;

// ─── Department (full record) ───────────────────────────────────────

export type DepartmentRow = {
  id:        string;
  code:      string;
  label:     string;
  createdAt: string;
};

export type DepartmentsListResponse = {
  data:   DepartmentRow[];
  total:  number;
  limit:  number;
  offset: number;
};

export type CreateDepartmentPayload = {
  code:  string;
  label: string;
};

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

// ─── Storage location (full record) ─────────────────────────────────

export type StorageLocationRow = {
  id:        string;
  code:      string;
  label:     string;
  address:   string | null;
  createdAt: string;
};

export type StorageLocationsListResponse = {
  data:   StorageLocationRow[];
  total:  number;
  limit:  number;
  offset: number;
};

export type CreateStorageLocationPayload = {
  code:     string;
  label:    string;
  address?: string | null;
};

export type UpdateStorageLocationPayload = Partial<CreateStorageLocationPayload>;

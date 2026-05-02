import type { RegionLookup } from "./lookups";

// ─── Legacy / sample-data shape ─────────────────────────────────────
// Used by `sampleData.tsx` and the existing projects UI page until they
// are migrated to the API.

export type Project = {
  wbs: string;
  name: string;
  location: string;
  itemsIssued: number;
  qtyConsumed: string;
  lastActivity: string;
};

// ─── API shape ──────────────────────────────────────────────────────

export type ProjectStatus = "active" | "on_hold" | "completed";

export type ProjectManager = {
  id:       string;
  fullName: string;
  email:    string;
};

export type ProjectListRow = {
  id:               string;
  wbs:              string;
  name:             string;
  location:         string;
  region:           RegionLookup | null;
  manager:          ProjectManager | null;
  status:           ProjectStatus;
  startDate:        string | null;
  estimatedEndDate: string | null;
  budget:           number | null;
  qtyConsumed:      number;
  lastActivity:     string | null;
};

export type ListProjectsQuery = {
  q?:      string;
  status?: ProjectStatus;
  limit?:  number;
  offset?: number;
};

export type ProjectsListResponse = {
  data:   ProjectListRow[];
  total:  number;
  limit:  number;
  offset: number;
};

export type ProjectDetail = {
  project: {
    id:               string;
    wbs:              string;
    name:             string;
    location:         string;
    region:           RegionLookup | null;
    manager:          ProjectManager | null;
    status:           ProjectStatus;
    startDate:        string | null;
    estimatedEndDate: string | null;
    budget:           number | null;
    description:      string | null;
  };
  topMaterials: Array<{
    itemId: string;
    name:   string | null;
    unit:   string | null;
    qty:    number;
  }>;
  recentMrns: Array<{
    id:       string;
    refNo:    string;
    date:     string;
    issuedTo: { id: string; fullName: string } | null;
    lines:    Array<{ item: string; qty: number; unit: string }>;
  }>;
};

export type CreateProjectPayload = {
  wbs:               string;
  name:              string;
  location:          string;
  regionCode?:       string | null;
  managerEmail?:     string | null;
  status?:           ProjectStatus;
  startDate?:        string | null;       // ISO date
  estimatedEndDate?: string | null;       // ISO date
  budget?:           number | null;
  description?:      string | null;
};

export type UpdateProjectPayload = Partial<CreateProjectPayload>;

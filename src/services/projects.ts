import type {
  CreateProjectPayload,
  ListProjectsQuery,
  ProjectDetail,
  ProjectsListResponse,
  UpdateProjectPayload,
} from "@/types/projects";
import { http, qs } from "./http";
import { failWithToast } from "./toast";

export async function listProjects(query: ListProjectsQuery = {}): Promise<ProjectsListResponse> {
  try {
    return await http.get<ProjectsListResponse>(`/api/projects${qs(query)}`);
  } catch (err) {
    failWithToast(err, "Could not load projects");
  }
}

export async function getProject(id: string): Promise<ProjectDetail> {
  try {
    return await http.get<ProjectDetail>(`/api/projects/${id}`);
  } catch (err) {
    failWithToast(err, "Could not load project");
  }
}

export async function createProject(payload: CreateProjectPayload) {
  try {
    return await http.post<ProjectDetail["project"]>("/api/projects", payload);
  } catch (err) {
    failWithToast(err, "Could not create project");
  }
}

export async function updateProject(id: string, payload: UpdateProjectPayload) {
  try {
    return await http.patch<ProjectDetail["project"]>(`/api/projects/${id}`, payload);
  } catch (err) {
    failWithToast(err, "Could not update project");
  }
}

export async function deleteProject(id: string): Promise<{ id: string }> {
  try {
    return await http.delete<{ id: string }>(`/api/projects/${id}`);
  } catch (err) {
    failWithToast(err, "Could not delete project");
  }
}

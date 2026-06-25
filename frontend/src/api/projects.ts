import { pb } from "@/lib/pocketbase";
import type { Project } from "@/types";

export async function listProjects(): Promise<Project[]> {
  return pb.send<Project[]>("/api/projects", { method: "GET" });
}

export async function getProject(id: string): Promise<Project> {
  return pb.send<Project>(`/api/projects/${id}`, { method: "GET" });
}

export type ProjectInput = Partial<
  Pick<
    Project,
    | "name"
    | "description"
    | "emails"
    | "branding_notes"
    | "resend_configured"
    | "status"
  >
>;

export async function createProject(data: ProjectInput): Promise<Project> {
  return pb.send<Project>("/api/projects", {
    method: "POST",
    body: {
      ...data,
      status: data.status ?? "draft",
    },
  });
}

export async function updateProject(
  id: string,
  data: ProjectInput,
): Promise<Project> {
  return pb.send<Project>(`/api/projects/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function deleteProject(id: string): Promise<boolean> {
  await pb.send(`/api/projects/${id}`, { method: "DELETE" });
  return true;
}

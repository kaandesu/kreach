import { pb } from "@/lib/pocketbase";
import type { Project } from "@/types";

const collection = () => pb.collection("projects");

export async function listProjects(): Promise<Project[]> {
  return collection().getFullList<Project>({ sort: "-updated" });
}

export async function getProject(id: string): Promise<Project> {
  return collection().getOne<Project>(id);
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
  // Attach the owning user so list/view rules can scope to the current account.
  return collection().create<Project>({
    ...data,
    status: data.status ?? "draft",
    user: pb.authStore.model?.id,
  });
}

export async function updateProject(
  id: string,
  data: ProjectInput,
): Promise<Project> {
  return collection().update<Project>(id, data);
}

export async function deleteProject(id: string): Promise<boolean> {
  return collection().delete(id);
}

import { pb } from "@/lib/pocketbase";
import type { GeneratedTemplate, Template } from "@/types";

export async function listTemplates(projectId: string): Promise<Template[]> {
  const query = new URLSearchParams({ project: projectId });
  return pb.send<Template[]>(`/api/templates?${query}`, { method: "GET" });
}

/** Persist a batch of in-browser generated candidates to a project. */
export async function storeTemplates(
  projectId: string,
  generated: GeneratedTemplate[],
): Promise<Template[]> {
  const created = await Promise.all(
    generated.map((g) =>
      pb.send<Template>("/api/templates", {
        method: "POST",
        body: {
          project: projectId,
          name: g.name,
          subject: g.subject,
          html: g.html,
          model: g.model,
          prompt: g.prompt,
          selected: false,
        },
      }),
    ),
  );
  return created;
}

export async function updateTemplate(
  id: string,
  data: Partial<Pick<Template, "name" | "subject" | "html" | "selected">>,
): Promise<Template> {
  return pb.send<Template>(`/api/templates/${id}`, {
    method: "PATCH",
    body: data,
  });
}

export async function setSelected(
  id: string,
  selected: boolean,
): Promise<Template> {
  return updateTemplate(id, { selected });
}

export async function deleteTemplate(id: string): Promise<boolean> {
  await pb.send(`/api/templates/${id}`, { method: "DELETE" });
  return true;
}

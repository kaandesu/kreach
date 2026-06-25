import { pb } from "@/lib/pocketbase";
import type { GeneratedTemplate, Template } from "@/types";

const collection = () => pb.collection("templates");

export async function listTemplates(projectId: string): Promise<Template[]> {
  return collection().getFullList<Template>({
    filter: pb.filter("project = {:project}", { project: projectId }),
    sort: "created",
  });
}

/** Persist a batch of in-browser generated candidates to a project. */
export async function storeTemplates(
  projectId: string,
  generated: GeneratedTemplate[],
): Promise<Template[]> {
  const created = await Promise.all(
    generated.map((g) =>
      collection().create<Template>({
        project: projectId,
        name: g.name,
        subject: g.subject,
        html: g.html,
        model: g.model,
        prompt: g.prompt,
        selected: false,
      }),
    ),
  );
  return created;
}

export async function updateTemplate(
  id: string,
  data: Partial<Pick<Template, "name" | "subject" | "html" | "selected">>,
): Promise<Template> {
  return collection().update<Template>(id, data);
}

export async function setSelected(
  id: string,
  selected: boolean,
): Promise<Template> {
  return collection().update<Template>(id, { selected });
}

export async function deleteTemplate(id: string): Promise<boolean> {
  return collection().delete(id);
}

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  deleteTemplate,
  listTemplates,
  setSelected,
  storeTemplates,
  updateTemplate,
} from "@/api/templates";
import type { GeneratedTemplate, Template } from "@/types";

export const templateKeys = {
  byProject: (projectId: string) => ["templates", projectId] as const,
};

export function useTemplates(projectId: string | undefined) {
  return useQuery({
    queryKey: templateKeys.byProject(projectId ?? ""),
    queryFn: () => listTemplates(projectId as string),
    enabled: Boolean(projectId),
  });
}

export function useStoreTemplates(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (generated: GeneratedTemplate[]) =>
      storeTemplates(projectId, generated),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: templateKeys.byProject(projectId) }),
  });
}

export function useSetTemplateSelected(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, selected }: { id: string; selected: boolean }) =>
      setSelected(id, selected),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: templateKeys.byProject(projectId) }),
  });
}

export function useUpdateTemplate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<Template, "name" | "subject" | "html" | "selected">>;
    }) => updateTemplate(id, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: templateKeys.byProject(projectId) }),
  });
}

export function useDeleteTemplate(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: templateKeys.byProject(projectId) }),
  });
}

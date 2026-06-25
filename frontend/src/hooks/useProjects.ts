import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  updateProject,
  type ProjectInput,
} from "@/api/projects";

export const projectKeys = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  return useQuery({ queryKey: projectKeys.all, queryFn: listProjects });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(id ?? ""),
    queryFn: () => getProject(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProjectInput) => createProject(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectInput }) =>
      updateProject(id, data),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: projectKeys.all });
      qc.invalidateQueries({ queryKey: projectKeys.detail(project.id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

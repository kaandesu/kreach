import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listLogs, subscribeLogs } from "@/api/logs";

export const logKeys = {
  byProject: (projectId: string) => ["logs", projectId] as const,
};

/** Logs query with a live realtime subscription that refetches on PB changes. */
export function useLogs(projectId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: logKeys.byProject(projectId ?? ""),
    queryFn: () => listLogs(projectId as string),
    enabled: Boolean(projectId),
  });

  useEffect(() => {
    if (!projectId) return;
    let unsub: (() => void) | undefined;
    let active = true;

    subscribeLogs(projectId, () => {
      qc.invalidateQueries({ queryKey: logKeys.byProject(projectId) });
    })
      .then((fn) => {
        if (active) unsub = fn;
        else fn();
      })
      .catch(() => {
        /* realtime unavailable (e.g. backend offline) — polling/refetch still works */
      });

    return () => {
      active = false;
      unsub?.();
    };
  }, [projectId, qc]);

  return query;
}

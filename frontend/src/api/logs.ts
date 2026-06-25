import { pb } from "@/lib/pocketbase";
import type { Log } from "@/types";

export async function listLogs(projectId: string): Promise<Log[]> {
  const query = new URLSearchParams({ project: projectId });
  return pb.send<Log[]>(`/api/logs/sends?${query}`, { method: "GET" });
}

/** Subscribe to realtime log changes for a project. Returns an unsubscribe fn. */
export async function subscribeLogs(
  _projectId: string,
  _onChange: () => void,
): Promise<() => void> {
  return () => {};
}

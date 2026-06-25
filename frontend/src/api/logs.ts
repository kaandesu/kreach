import { pb } from "@/lib/pocketbase";
import type { Log } from "@/types";

const collection = () => pb.collection("logs");

export async function listLogs(projectId: string): Promise<Log[]> {
  return collection().getFullList<Log>({
    filter: pb.filter("project = {:project}", { project: projectId }),
    sort: "-created",
  });
}

/** Subscribe to realtime log changes for a project. Returns an unsubscribe fn. */
export async function subscribeLogs(
  projectId: string,
  onChange: () => void,
): Promise<() => void> {
  const unsub = await collection().subscribe<Log>(
    "*",
    (e) => {
      if (e.record.project === projectId) onChange();
    },
    { filter: pb.filter("project = {:project}", { project: projectId }) },
  );
  return unsub;
}

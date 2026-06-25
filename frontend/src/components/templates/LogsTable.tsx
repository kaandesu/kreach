import { CheckCircle2, Clock, Inbox, Loader2, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { useLogs } from "@/hooks/useLogs";
import type { Log, LogStatus } from "@/types";

function StatusBadge({ status }: { status: LogStatus }) {
  if (status === "sent")
    return (
      <Badge variant="success">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Sent
      </Badge>
    );
  if (status === "failed")
    return (
      <Badge variant="destructive">
        <XCircle className="mr-1 h-3 w-3" /> Failed
      </Badge>
    );
  return (
    <Badge variant="warning">
      <Clock className="mr-1 h-3 w-3" /> Queued
    </Badge>
  );
}

export function LogsTable({ projectId }: { projectId: string }) {
  const { data, isLoading } = useLogs(projectId);
  const logs: Log[] = data ?? [];

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No send logs yet"
        description="Once you send this campaign, every delivery shows up here in real time."
      />
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead className="text-right">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.recipient}</TableCell>
              <TableCell>
                <StatusBadge status={log.status} />
              </TableCell>
              <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                {log.error || "—"}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {formatDate(log.sent_at || log.created)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

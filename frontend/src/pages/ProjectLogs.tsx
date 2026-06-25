import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogsTable } from "@/components/templates/LogsTable";
import { useProject } from "@/hooks/useProjects";

export default function ProjectLogs() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to={`/app/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to project
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Send logs</h1>
            <p className="text-sm text-muted-foreground">
              {project?.name ?? "Loading…"}
            </p>
          </div>
          {project?.status && (
            <Badge variant="secondary" className="capitalize">
              {project.status}
            </Badge>
          )}
        </div>
      </div>

      {projectId && <LogsTable projectId={projectId} />}
    </div>
  );
}

import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { StepShell } from "../StepShell";
import { Button } from "@/components/ui/button";
import { LogsTable } from "@/components/templates/LogsTable";
import type { Project } from "@/types";

export function LogsStep({
  project,
  onBack,
}: {
  project: Project;
  onBack: () => void;
}) {
  return (
    <StepShell
      title="Send logs"
      description="Live delivery results for this campaign."
      onBack={onBack}
      hideNext
    >
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Your campaign is on its way. Results update here in real time.
      </div>

      <LogsTable projectId={project.id} />

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link to={`/app/projects/${project.id}/logs`}>
            Open full logs
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </StepShell>
  );
}

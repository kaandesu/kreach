import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Stepper, type Step } from "@/components/stepper/Stepper";
import { ProjectInfoStep } from "@/components/stepper/steps/ProjectInfoStep";
import { AudienceStep } from "@/components/stepper/steps/AudienceStep";
import { ResendKeyStep } from "@/components/stepper/steps/ResendKeyStep";
import { GenerateStep } from "@/components/stepper/steps/GenerateStep";
import { PreviewSelectStep } from "@/components/stepper/steps/PreviewSelectStep";
import { SendStep } from "@/components/stepper/steps/SendStep";
import { LogsStep } from "@/components/stepper/steps/LogsStep";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { useProject } from "@/hooks/useProjects";
import { useTemplates } from "@/hooks/useTemplates";
import { parseEmails } from "@/lib/utils";
import { FolderX } from "lucide-react";
import type { Template } from "@/types";

const STEPS: Step[] = [
  { id: "info", title: "Project info" },
  { id: "audience", title: "Audience" },
  { id: "resend", title: "Resend key" },
  { id: "generate", title: "Generate" },
  { id: "preview", title: "Preview & select" },
  { id: "send", title: "Send" },
  { id: "logs", title: "Logs" },
];

export default function ProjectWizard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project, isLoading, isError } = useProject(projectId);
  const { data: templatesData } = useTemplates(projectId);
  const templates: Template[] = templatesData ?? [];

  const [current, setCurrent] = useState(0);

  // Furthest step the user is allowed to jump to, derived from saved progress.
  const maxReached = useMemo(() => {
    if (!project) return 0;
    let reached = 0;
    if (project.name) reached = 1;
    if (parseEmails(project.emails ?? "").length > 0) reached = 2;
    if (project.resend_configured) reached = 3;
    if (templates.length > 0) reached = 4;
    if (templates.some((t) => t.selected)) reached = 5;
    if (project.status === "sent") reached = 6;
    return reached;
  }, [project, templates]);

  // On first load, resume at the furthest reached step.
  const [resumed, setResumed] = useState(false);
  useEffect(() => {
    if (project && !resumed) {
      setCurrent(maxReached);
      setResumed(true);
    }
  }, [project, maxReached, resumed]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="This project may have been deleted or you don’t have access."
        action={
          <Button asChild>
            <Link to="/app">Back to projects</Link>
          </Button>
        }
      />
    );
  }

  const goNext = () => setCurrent((c) => Math.min(STEPS.length - 1, c + 1));
  const goBack = () => setCurrent((c) => Math.max(0, c - 1));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/app">
              <ArrowLeft className="h-4 w-4" />
              All projects
            </Link>
          </Button>
          <Badge variant="secondary" className="capitalize">
            {project.status ?? "draft"}
          </Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <Stepper
          steps={STEPS}
          current={current}
          maxReached={maxReached}
          onStepClick={setCurrent}
        />
      </div>

      {current === 0 && <ProjectInfoStep project={project} onNext={goNext} />}
      {current === 1 && (
        <AudienceStep project={project} onNext={goNext} onBack={goBack} />
      )}
      {current === 2 && (
        <ResendKeyStep project={project} onNext={goNext} onBack={goBack} />
      )}
      {current === 3 && (
        <GenerateStep project={project} onNext={goNext} onBack={goBack} />
      )}
      {current === 4 && (
        <PreviewSelectStep project={project} onNext={goNext} onBack={goBack} />
      )}
      {current === 5 && (
        <SendStep project={project} onNext={goNext} onBack={goBack} />
      )}
      {current === 6 && <LogsStep project={project} onBack={goBack} />}
    </div>
  );
}

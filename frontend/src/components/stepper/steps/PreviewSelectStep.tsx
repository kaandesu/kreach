import { Loader2, Mails } from "lucide-react";
import { StepShell } from "../StepShell";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { TemplateCard } from "@/components/templates/TemplateCard";
import {
  useDeleteTemplate,
  useSetTemplateSelected,
  useTemplates,
} from "@/hooks/useTemplates";
import { toast } from "@/components/ui/sonner";
import type { Project, Template } from "@/types";

export function PreviewSelectStep({
  project,
  onNext,
  onBack,
}: {
  project: Project;
  onNext: () => void;
  onBack: () => void;
}) {
  const { data, isLoading } = useTemplates(project.id);
  const templates: Template[] = data ?? [];
  const setSelected = useSetTemplateSelected(project.id);
  const remove = useDeleteTemplate(project.id);

  const selectedCount = templates.filter((t) => t.selected).length;

  return (
    <StepShell
      title="Preview & select"
      description="Open any template for a full inbox preview, then pick the ones you want to send."
      onBack={onBack}
      onNext={onNext}
      nextDisabled={selectedCount === 0}
      nextLabel={`Continue with ${selectedCount} selected`}
    >
      {selectedCount > 0 && (
        <Badge variant="success" className="w-fit">
          {selectedCount} selected
        </Badge>
      )}

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={Mails}
          title="No templates yet"
          description="Go back a step to generate templates for this project."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onToggleSelect={(selected) =>
                setSelected.mutate({ id: t.id, selected })
              }
              onDelete={() =>
                remove.mutate(t.id, {
                  onSuccess: () => toast.success("Template deleted"),
                })
              }
            />
          ))}
        </div>
      )}
    </StepShell>
  );
}

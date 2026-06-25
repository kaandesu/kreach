import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { StepShell } from "../StepShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateProject } from "@/hooks/useProjects";
import { pbError } from "@/lib/pocketbase";
import { toast } from "@/components/ui/sonner";
import type { Project } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Give your project a name"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProjectInfoStep({
  project,
  onNext,
}: {
  project: Project;
  onNext: () => void;
}) {
  const update = useUpdateProject();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: project.name ?? "",
      description: project.description ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await update.mutateAsync({ id: project.id, data: values });
      onNext();
    } catch (err) {
      toast.error(pbError(err, "Could not save project details"));
    }
  }

  return (
    <StepShell
      title="Project info"
      description="Name your campaign so you can find it later."
      hideBack
      onNext={form.handleSubmit(onSubmit)}
      nextLoading={update.isPending}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          placeholder="Q3 Founder Outreach"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-xs text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="What is this campaign about and who is it for?"
          {...form.register("description")}
        />
      </div>
    </StepShell>
  );
}

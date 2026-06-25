import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  FolderPlus,
  Loader2,
  MoreVertical,
  Rocket,
  ScrollText,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
} from "@/hooks/useProjects";
import { formatDate } from "@/lib/utils";
import { pbError } from "@/lib/pocketbase";
import { toast } from "@/components/ui/sonner";
import type { Project } from "@/types";

const schema = z.object({
  name: z.string().min(1, "Give your project a name"),
  description: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "success" | "warning"
> = {
  draft: "secondary",
  generating: "warning",
  ready: "default",
  sending: "warning",
  sent: "success",
};

export default function Dashboard() {
  const { data, isLoading } = useProjects();
  const projects: Project[] = data ?? [];
  const create = useCreateProject();
  const remove = useDeleteProject();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  });

  async function onCreate(values: FormValues) {
    try {
      const project = await create.mutateAsync(values);
      setOpen(false);
      form.reset();
      navigate(`/app/projects/${project.id}`);
    } catch (err) {
      toast.error(pbError(err, "Could not create project"));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Create a campaign and let AI draft your outreach.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <FolderPlus className="h-4 w-4" />
              New project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit(onCreate)}
              className="space-y-4"
              id="create-project"
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
                  placeholder="What is this campaign about?"
                  {...form.register("description")}
                />
              </div>
            </form>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-project"
                disabled={create.isPending}
              >
                {create.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create & start
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={Rocket}
          title="No projects yet"
          description="Spin up your first campaign — name it, paste your list, and generate templates in minutes."
          action={
            <Button onClick={() => setOpen(true)}>
              <FolderPlus className="h-4 w-4" />
              New project
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer transition-colors hover:border-primary/40"
              onClick={() => navigate(`/app/projects/${project.id}`)}
            >
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <div className="min-w-0">
                  <CardTitle className="truncate">{project.name}</CardTitle>
                  <CardDescription className="mt-1 line-clamp-2">
                    {project.description || "No description"}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/app/projects/${project.id}/logs`)
                      }
                    >
                      <ScrollText className="h-4 w-4" />
                      View logs
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        remove.mutate(project.id, {
                          onSuccess: () => toast.success("Project deleted"),
                          onError: (err) =>
                            toast.error(pbError(err, "Could not delete")),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant={STATUS_VARIANT[project.status ?? "draft"]}>
                  <span className="capitalize">{project.status ?? "draft"}</span>
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(project.updated)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

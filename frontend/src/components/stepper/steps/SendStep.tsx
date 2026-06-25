import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, KeyRound, Send, Users } from "lucide-react";
import { StepShell } from "../StepShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTemplates } from "@/hooks/useTemplates";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useUpdateProject } from "@/hooks/useProjects";
import { sendEmails } from "@/api/send";
import { parseEmails } from "@/lib/utils";
import { pbError } from "@/lib/pocketbase";
import { toast } from "@/components/ui/sonner";
import type { Project, SendResponse, Template } from "@/types";

export function SendStep({
  project,
  onNext,
  onBack,
}: {
  project: Project;
  onNext: () => void;
  onBack: () => void;
}) {
  const { data: templatesData } = useTemplates(project.id);
  const templates: Template[] = templatesData ?? [];
  const { resendKey, hasResendKey } = useApiKeys();
  const updateProject = useUpdateProject();

  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");

  const recipients = useMemo(
    () => parseEmails(project.emails ?? ""),
    [project.emails],
  );
  const selected = useMemo(
    () => templates.filter((t) => t.selected),
    [templates],
  );

  const send = useMutation({
    mutationFn: async () => {
      // Mark sending; one delivery call per selected template.
      await updateProject.mutateAsync({
        id: project.id,
        data: { status: "sending" },
      });
      const responses: SendResponse[] = [];
      for (const template of selected) {
        responses.push(
          await sendEmails({
            projectId: project.id,
            template,
            resendApiKey: resendKey,
            recipients,
            fromEmail:
              fromName && fromEmail
                ? `${fromName} <${fromEmail}>`
                : fromEmail || undefined,
          }),
        );
      }
      return responses;
    },
    onSuccess: async (responses) => {
      const sent = responses.reduce((n, r) => n + r.sent, 0);
      const failed = responses.reduce((n, r) => n + r.failed, 0);
      await updateProject.mutateAsync({
        id: project.id,
        data: { status: "sent" },
      });
      if (failed > 0) {
        toast.warning(`Sent ${sent}, ${failed} failed. See logs for details.`);
      } else {
        toast.success(`Sent ${sent} email${sent === 1 ? "" : "s"}!`);
      }
      onNext();
    },
    onError: (err) => {
      toast.error(pbError(err, "Send failed — check the backend send route"));
    },
  });

  const blocked = !hasResendKey || selected.length === 0 || recipients.length === 0;

  return (
    <StepShell
      title="Send emails"
      description="Review the campaign, then deliver via Resend."
      onBack={onBack}
      onNext={() => send.mutate()}
      nextLabel={`Send to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}`}
      nextDisabled={blocked}
      nextLoading={send.isPending}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-muted-foreground" />
            Recipients
          </div>
          <p className="mt-1 text-2xl font-semibold">{recipients.length}</p>
          <p className="text-xs text-muted-foreground">parsed from your list</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Send className="h-4 w-4 text-muted-foreground" />
            Selected templates
          </div>
          <p className="mt-1 text-2xl font-semibold">{selected.length}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {selected.map((t) => (
              <Badge key={t.id} variant="secondary" className="text-[10px]">
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="from-name">From name (optional)</Label>
          <Input
            id="from-name"
            placeholder="Ada from Acme"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="from-email">From email (optional)</Label>
          <Input
            id="from-email"
            type="email"
            placeholder="ada@acme.com"
            value={fromEmail}
            onChange={(e) => setFromEmail(e.target.value)}
          />
        </div>
      </div>

      {!hasResendKey && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <KeyRound className="h-4 w-4 shrink-0" />
          No Resend key set for this session — go back to the Resend step to add
          it.
        </div>
      )}
      {recipients.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          No valid recipients — add some in the Audience step.
        </div>
      )}
    </StepShell>
  );
}

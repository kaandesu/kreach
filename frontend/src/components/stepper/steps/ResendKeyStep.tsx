import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { StepShell } from "../StepShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useUpdateProject } from "@/hooks/useProjects";
import { toast } from "@/components/ui/sonner";
import { pbError } from "@/lib/pocketbase";
import type { Project } from "@/types";

export function ResendKeyStep({
  project,
  onNext,
  onBack,
}: {
  project: Project;
  onNext: () => void;
  onBack: () => void;
}) {
  const { resendKey, setResendKey, hasResendKey } = useApiKeys();
  const update = useUpdateProject();

  async function save() {
    if (!hasResendKey) {
      toast.error("Enter your Resend API key to continue");
      return;
    }
    try {
      // Persist only the *fact* that a key is configured, never the key itself.
      if (!project.resend_configured) {
        await update.mutateAsync({
          id: project.id,
          data: { resend_configured: true },
        });
      }
      onNext();
    } catch (err) {
      toast.error(pbError(err, "Could not save"));
    }
  }

  return (
    <StepShell
      title="Resend API key"
      description="Used to deliver your emails. We pass it to the send service only when you hit send."
      onBack={onBack}
      onNext={save}
      nextDisabled={!hasResendKey}
      nextLoading={update.isPending}
    >
      <div className="space-y-2">
        <Label htmlFor="resend">Resend API key</Label>
        <div className="relative">
          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="resend"
            type="password"
            autoComplete="off"
            className="pl-9"
            placeholder="re_xxxxxxxxxxxxxxxxxxxx"
            value={resendKey}
            onChange={(e) => setResendKey(e.target.value)}
          />
        </div>
        {hasResendKey && (
          <p className="flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Key set for this session.
          </p>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
        <span>
          Your Resend key is held only in this browser session and forwarded to
          the delivery service at send time. It is never stored in the Kreach
          database. Get a key at{" "}
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            resend.com/api-keys
          </a>
          .
        </span>
      </div>
    </StepShell>
  );
}

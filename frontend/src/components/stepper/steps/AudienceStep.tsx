import { useMemo, useState } from "react";
import { Users } from "lucide-react";
import { StepShell } from "../StepShell";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUpdateProject } from "@/hooks/useProjects";
import { parseEmails } from "@/lib/utils";
import { pbError } from "@/lib/pocketbase";
import { toast } from "@/components/ui/sonner";
import type { Project } from "@/types";

export function AudienceStep({
  project,
  onNext,
  onBack,
}: {
  project: Project;
  onNext: () => void;
  onBack: () => void;
}) {
  const update = useUpdateProject();
  const [emails, setEmails] = useState(project.emails ?? "");
  const [branding, setBranding] = useState(project.branding_notes ?? "");

  const validEmails = useMemo(() => parseEmails(emails), [emails]);

  async function save() {
    if (validEmails.length === 0) {
      toast.error("Add at least one valid recipient email");
      return;
    }
    try {
      await update.mutateAsync({
        id: project.id,
        data: { emails, branding_notes: branding },
      });
      onNext();
    } catch (err) {
      toast.error(pbError(err, "Could not save audience"));
    }
  }

  return (
    <StepShell
      title="Audience & branding"
      description="Paste your recipient emails and any branding notes for the AI."
      onBack={onBack}
      onNext={save}
      nextDisabled={validEmails.length === 0}
      nextLoading={update.isPending}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="emails">Recipient emails</Label>
          <Badge variant={validEmails.length ? "success" : "secondary"}>
            <Users className="mr-1 h-3 w-3" />
            {validEmails.length} valid
          </Badge>
        </div>
        <Textarea
          id="emails"
          rows={6}
          className="font-mono text-xs scrollbar-thin"
          placeholder="jane@acme.com, john@globex.com&#10;sam@initech.com"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Separate by commas, spaces, or new lines. Duplicates and invalid
          addresses are ignored automatically.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="branding">Branding notes (optional)</Label>
        <Textarea
          id="branding"
          rows={5}
          placeholder="Tone of voice, product, value proposition, the offer, target persona, links to include…"
          value={branding}
          onChange={(e) => setBranding(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          The more context you give, the better the generated templates.
        </p>
      </div>
    </StepShell>
  );
}

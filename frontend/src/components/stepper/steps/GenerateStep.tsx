import { useState } from "react";
import { KeyRound, Loader2, Sparkles } from "lucide-react";
import { StepShell } from "../StepShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ApiKeyDialog } from "@/components/common/ApiKeyDialog";
import { TemplateCandidateCard } from "@/components/templates/TemplateCandidateCard";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useStoreTemplates } from "@/hooks/useTemplates";
import { generateTemplate, generateTemplates } from "@/lib/openai";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { GeneratedTemplate, Project } from "@/types";

const COUNTS = [1, 2, 3, 4, 5];

export function GenerateStep({
  project,
  onNext,
  onBack,
}: {
  project: Project;
  onNext: () => void;
  onBack: () => void;
}) {
  const { openaiKey, hasOpenaiKey, setOpenaiKey } = useApiKeys();
  const store = useStoreTemplates(project.id);

  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [count, setCount] = useState(3);
  const [candidates, setCandidates] = useState<GeneratedTemplate[]>([]);
  const [generating, setGenerating] = useState(false);
  const [regenIds, setRegenIds] = useState<Set<string>>(new Set());

  function requireKey(action: () => void) {
    if (!hasOpenaiKey) {
      setKeyDialogOpen(true);
      return;
    }
    action();
  }

  async function handleGenerate() {
    requireKey(async () => {
      setGenerating(true);
      try {
        const results = await generateTemplates({
          apiKey: openaiKey,
          projectName: project.name,
          brandingNotes: project.branding_notes,
          count,
        });
        setCandidates(results);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Generation failed",
        );
      } finally {
        setGenerating(false);
      }
    });
  }

  async function handleRegenerate(localId: string, index: number) {
    setRegenIds((s) => new Set(s).add(localId));
    try {
      const fresh = await generateTemplate(
        {
          apiKey: openaiKey,
          projectName: project.name,
          brandingNotes: project.branding_notes,
        },
        index,
      );
      setCandidates((cs) =>
        cs.map((c) => (c.localId === localId ? { ...fresh, localId } : c)),
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Regeneration failed");
    } finally {
      setRegenIds((s) => {
        const next = new Set(s);
        next.delete(localId);
        return next;
      });
    }
  }

  function handleOverwrite(
    localId: string,
    patch: Pick<GeneratedTemplate, "name" | "subject" | "html">,
  ) {
    setCandidates((cs) =>
      cs.map((c) => (c.localId === localId ? { ...c, ...patch } : c)),
    );
  }

  async function handleStore() {
    if (candidates.length === 0) {
      toast.error("Generate at least one template first");
      return;
    }
    try {
      await store.mutateAsync(candidates);
      toast.success(
        `Saved ${candidates.length} template${candidates.length > 1 ? "s" : ""}`,
      );
      onNext();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save templates",
      );
    }
  }

  return (
    <StepShell
      title="Generate templates"
      description="Use your OpenAI key, in your browser, to draft email designs. Regenerate or edit any before saving."
      onBack={onBack}
      onNext={handleStore}
      nextLabel="Save & continue"
      nextDisabled={candidates.length === 0}
      nextLoading={store.isPending}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Label>How many variants?</Label>
          <div className="flex gap-1.5">
            {COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium transition-colors",
                  count === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-accent",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setKeyDialogOpen(true)}
          >
            <KeyRound className="h-3.5 w-3.5" />
            {hasOpenaiKey ? "Change key" : "Set OpenAI key"}
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {candidates.length ? "Regenerate all" : "Generate"}
          </Button>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{candidates.length} draft(s)</Badge>
          <p className="text-xs text-muted-foreground">
            Preview, edit, or redo individual templates, then save them to your
            project.
          </p>
        </div>
      )}

      {generating && candidates.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex h-72 items-center justify-center rounded-xl border bg-muted/30"
            >
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ))}
        </div>
      ) : candidates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c, i) => (
            <TemplateCandidateCard
              key={c.localId}
              template={c}
              regenerating={regenIds.has(c.localId)}
              onRegenerate={() => handleRegenerate(c.localId, i)}
              onOverwrite={(patch) => handleOverwrite(c.localId, patch)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No drafts yet. Choose how many variants you want and hit{" "}
          <span className="font-medium text-foreground">Generate</span>.
        </div>
      )}

      <ApiKeyDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        title="Your OpenAI API key"
        description="Templates are generated directly from your browser using this key. It never touches the Kreach backend."
        label="OpenAI API key"
        placeholder="sk-..."
        initialValue={openaiKey}
        onSave={(v) => {
          setOpenaiKey(v);
          toast.success("OpenAI key saved for this session");
        }}
      />
    </StepShell>
  );
}

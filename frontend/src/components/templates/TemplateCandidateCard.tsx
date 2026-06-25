import { useState } from "react";
import { Eye, Loader2, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { EmailPreviewDialog } from "./EmailPreviewDialog";
import type { GeneratedTemplate } from "@/types";

/** A not-yet-stored AI candidate with inline preview, regenerate, and edit. */
export function TemplateCandidateCard({
  template,
  regenerating,
  onRegenerate,
  onOverwrite,
}: {
  template: GeneratedTemplate;
  regenerating: boolean;
  onRegenerate: () => void;
  onOverwrite: (patch: Pick<GeneratedTemplate, "name" | "subject" | "html">) => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject);
  const [html, setHtml] = useState(template.html);

  function openEdit() {
    setName(template.name);
    setSubject(template.subject);
    setHtml(template.html);
    setEditOpen(true);
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="relative h-48 overflow-hidden border-b bg-white">
        {regenerating && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {/* Scaled-down live preview thumbnail */}
        <div className="pointer-events-none absolute inset-0 origin-top-left scale-[0.55] [width:182%] [height:182%]">
          <EmailPreviewFrame html={template.html} title={template.name} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{template.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {template.subject}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={openEdit}>
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={regenerating}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Redo
          </Button>
        </div>
      </div>

      <EmailPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={template.subject}
        html={template.html}
        name={template.name}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="t-name">Name</Label>
                <Input
                  id="t-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-subject">Subject</Label>
                <Input
                  id="t-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-html">HTML</Label>
              <Textarea
                id="t-html"
                rows={12}
                className="font-mono text-xs scrollbar-thin"
                value={html}
                onChange={(e) => setHtml(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                onOverwrite({ name, subject, html });
                setEditOpen(false);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

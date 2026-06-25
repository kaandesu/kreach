import { useState } from "react";
import { Check, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { EmailPreviewDialog } from "./EmailPreviewDialog";
import { cn } from "@/lib/utils";
import type { Template } from "@/types";

/** A stored template with select-toggle, preview, and delete. */
export function TemplateCard({
  template,
  onToggleSelect,
  onDelete,
}: {
  template: Template;
  onToggleSelect: (selected: boolean) => void;
  onDelete?: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const selected = Boolean(template.selected);

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all",
        selected && "ring-2 ring-primary",
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      <button
        type="button"
        onClick={() => onToggleSelect(!selected)}
        className="relative block h-48 overflow-hidden border-b bg-white text-left"
      >
        <div className="pointer-events-none absolute inset-0 origin-top-left scale-[0.55] [width:182%] [height:182%]">
          <EmailPreviewFrame html={template.html} title={template.name} />
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{template.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {template.subject}
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <Button
            variant={selected ? "secondary" : "default"}
            size="sm"
            className="flex-1"
            onClick={() => onToggleSelect(!selected)}
          >
            {selected ? (
              <>
                <Check className="h-3.5 w-3.5" /> Selected
              </>
            ) : (
              "Select"
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {onDelete && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {template.model && (
          <Badge variant="secondary" className="w-fit text-[10px]">
            {template.model}
          </Badge>
        )}
      </div>

      <EmailPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        subject={template.subject}
        html={template.html}
        name={template.name}
      />
    </Card>
  );
}

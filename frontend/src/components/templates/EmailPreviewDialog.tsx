import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailPreviewFrame } from "./EmailPreviewFrame";
import { cn } from "@/lib/utils";

type Viewport = "desktop" | "mobile";

/** Full-screen preview of a template's HTML with desktop/mobile viewports,
 *  framed like an email client (sender row + subject). */
export function EmailPreviewDialog({
  open,
  onOpenChange,
  subject,
  html,
  name,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  html: string;
  name?: string;
}) {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 p-0">
        <DialogHeader className="flex-row items-center justify-between space-y-0 border-b px-5 py-3 text-left">
          <div className="min-w-0">
            <DialogTitle className="truncate text-base">{subject}</DialogTitle>
            <p className="truncate text-xs text-muted-foreground">
              {name ? `${name} · ` : ""}Inbox preview
            </p>
          </div>
          <div className="mr-8 flex items-center gap-1 rounded-md border p-0.5">
            <Button
              variant={viewport === "desktop" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewport("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={viewport === "mobile" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewport("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-1 items-start justify-center overflow-auto bg-muted/40 p-6 scrollbar-thin">
          <div
            className={cn(
              "h-full overflow-hidden rounded-lg border bg-white shadow-sm transition-all",
              viewport === "desktop" ? "w-full max-w-[680px]" : "w-[390px]",
            )}
          >
            <div className="flex items-center gap-2 border-b bg-white px-4 py-2">
              <Badge variant="secondary" className="text-[10px]">
                To: recipient@example.com
              </Badge>
              <span className="truncate text-xs font-medium text-zinc-700">
                {subject}
              </span>
            </div>
            <div className="h-[calc(100%-37px)]">
              <EmailPreviewFrame html={html} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Collects a third-party API key from the user. The key is handed back via
 * `onSave` and held only client-side (sessionStorage) — never sent to or stored
 * on the Kreach backend. Used for the OpenAI key (and reusable for Resend).
 */
export function ApiKeyDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  initialValue = "",
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="api-key">{label}</Label>
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value.trim()) {
                onSave(value.trim());
                onOpenChange(false);
              }
            }}
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Stored only in this browser session — never sent to our servers.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!value.trim()}
            onClick={() => {
              onSave(value.trim());
              onOpenChange(false);
            }}
          >
            Save key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

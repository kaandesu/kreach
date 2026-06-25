import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/** Consistent shell for each wizard step: titled card with a back/next footer. */
export function StepShell({
  title,
  description,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  nextLoading,
  hideBack,
  hideNext,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  hideBack?: boolean;
  hideNext?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        <div className="flex items-center justify-between border-t pt-5">
          {!hideBack ? (
            <Button variant="ghost" onClick={onBack} disabled={!onBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {!hideNext && (
            <Button onClick={onNext} disabled={nextDisabled || nextLoading}>
              {nextLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {nextLabel}
              {!nextLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

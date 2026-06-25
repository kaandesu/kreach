import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
}

/**
 * Horizontal step indicator. Completed steps and the current step (plus any
 * already-reached step) are clickable for free backward/forward navigation.
 */
export function Stepper({
  steps,
  current,
  maxReached,
  onStepClick,
}: {
  steps: Step[];
  current: number;
  maxReached: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((step, i) => {
        const isComplete = i < current;
        const isCurrent = i === current;
        const isReachable = i <= maxReached;
        return (
          <li
            key={step.id}
            className={cn(
              "flex items-center",
              i < steps.length - 1 && "flex-1",
            )}
          >
            <button
              type="button"
              disabled={!isReachable || !onStepClick}
              onClick={() => onStepClick?.(i)}
              className={cn(
                "group flex items-center gap-2 text-left",
                isReachable && onStepClick
                  ? "cursor-pointer"
                  : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  isComplete &&
                    "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary bg-primary/15 text-primary ring-2 ring-primary/30",
                  !isComplete &&
                    !isCurrent &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-medium md:inline",
                  isCurrent ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.title}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={cn(
                  "mx-2 h-px flex-1 transition-colors",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

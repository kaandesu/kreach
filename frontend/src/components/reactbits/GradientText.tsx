import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** reactbits.dev-style animated gradient text used for brand wordmarks. */
export function GradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "animate-aurora bg-[length:200%_auto] bg-clip-text text-transparent",
        "bg-[linear-gradient(90deg,hsl(263_70%_65%),hsl(217_91%_65%),hsl(291_64%_65%),hsl(263_70%_65%))]",
        "motion-reduce:animate-none",
        className,
      )}
    >
      {children}
    </span>
  );
}

import { cn } from "@/lib/utils";

/**
 * Animated aurora gradient backdrop — a reactbits.dev-style decorative surface
 * used behind the auth screens. Pure CSS (no canvas), respects reduced motion.
 */
export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className="absolute -inset-[40%] animate-aurora bg-[length:200%_200%] opacity-60 blur-3xl motion-reduce:animate-none"
        style={{
          backgroundImage:
            "radial-gradient(at 20% 30%, hsl(263 70% 50% / 0.55) 0px, transparent 50%), radial-gradient(at 80% 20%, hsl(217 91% 60% / 0.45) 0px, transparent 50%), radial-gradient(at 60% 80%, hsl(291 64% 55% / 0.5) 0px, transparent 50%), radial-gradient(at 10% 90%, hsl(190 90% 50% / 0.35) 0px, transparent 50%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_75%)]" />
    </div>
  );
}

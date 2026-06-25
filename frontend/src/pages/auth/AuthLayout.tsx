import type { ReactNode } from "react";
import { AuroraBackground } from "@/components/reactbits/AuroraBackground";
import { GradientText } from "@/components/reactbits/GradientText";
import { Send } from "lucide-react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <AuroraBackground />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Send className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <GradientText>Kreach</GradientText>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            AI cold-email outreach, end to end.
          </p>
        </div>

        <div className="rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur-md">
          <div className="mb-5 space-y-1">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      </div>
    </div>
  );
}

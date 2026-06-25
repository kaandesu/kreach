import { Toaster as SonnerToaster, toast } from "sonner";

/** App-wide toast portal. Themed to match the dark shadcn palette. */
function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="bottom-right"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "group rounded-lg border border-border bg-card text-card-foreground shadow-lg",
        },
      }}
    />
  );
}

export { Toaster, toast };

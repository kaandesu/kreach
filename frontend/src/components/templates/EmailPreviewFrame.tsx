import { cn } from "@/lib/utils";

/**
 * Renders raw email HTML inside a sandboxed iframe via `srcDoc`, isolating the
 * email's inline styles from the app and approximating real email-client
 * rendering. The sandbox allows same-origin layout but blocks scripts.
 */
export function EmailPreviewFrame({
  html,
  className,
  title = "Email preview",
}: {
  html: string;
  className?: string;
  title?: string;
}) {
  return (
    <iframe
      title={title}
      srcDoc={html}
      sandbox=""
      className={cn(
        "h-full w-full border-0 bg-white",
        className,
      )}
    />
  );
}

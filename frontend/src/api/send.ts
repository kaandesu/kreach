import { pb } from "@/lib/pocketbase";
import type { SendResponse, Template } from "@/types";

/** Path of the backend custom send route. The backend (separate slice) holds
 *  the Resend call and writes `logs` rows; we only pass the key through at send
 *  time — it is never persisted on the backend. Override via env if the backend
 *  settles on a different path. */
const SEND_ROUTE =
  import.meta.env.VITE_SEND_ROUTE ?? "/api/kreach/send";

export interface SendEmailsParams {
  projectId: string;
  template: Template;
  resendApiKey: string;
  recipients: string[];
  fromEmail?: string;
}

/**
 * Hand the selected template + recipients + Resend key to the backend, which
 * performs delivery and logging. Isolated here so the request shape is the
 * single point to reconcile with the backend once it lands.
 */
export async function sendEmails(
  params: SendEmailsParams,
): Promise<SendResponse> {
  const results: SendResponse["results"] = [];
  for (const recipient of params.recipients) {
    try {
      await pb.send(SEND_ROUTE, {
        method: "POST",
        body: {
          to: recipient,
          subject: params.template.subject,
          html: params.template.html,
          resend_api_key: params.resendApiKey,
          from: params.fromEmail,
          template: params.template.id,
          project: params.projectId,
        },
      });
      results.push({ recipient, status: "sent" as const });
    } catch (err) {
      results.push({
        recipient,
        status: "failed" as const,
        error: err instanceof Error ? err.message : "Send failed",
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 650));
  }
  return {
    results,
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
  };
}

import { pb } from "@/lib/pocketbase";
import type { SendResponse } from "@/types";

/** Path of the backend custom send route. The backend (separate slice) holds
 *  the Resend call and writes `logs` rows; we only pass the key through at send
 *  time — it is never persisted on the backend. Override via env if the backend
 *  settles on a different path. */
const SEND_ROUTE =
  import.meta.env.VITE_SEND_ROUTE ?? "/api/kreach/send";

export interface SendEmailsParams {
  projectId: string;
  templateId: string;
  resendApiKey: string;
  recipients: string[];
  fromName?: string;
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
  return pb.send<SendResponse>(SEND_ROUTE, {
    method: "POST",
    body: {
      projectId: params.projectId,
      templateId: params.templateId,
      resendApiKey: params.resendApiKey,
      recipients: params.recipients,
      fromName: params.fromName,
      fromEmail: params.fromEmail,
    },
  });
}

/** Shared domain types mirroring the PocketBase collections defined in the
 *  backend slice. See /frontend/README.md for the assumed schema. */

export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId?: string;
  collectionName?: string;
}

export interface User extends BaseRecord {
  email: string;
  name?: string;
  avatar?: string;
  verified?: boolean;
}

export type ProjectStatus =
  | "draft"
  | "generating"
  | "ready"
  | "sending"
  | "sent";

export interface Project extends BaseRecord {
  user: string;
  name: string;
  description?: string;
  /** Raw pasted blob of recipient emails. */
  emails?: string;
  branding_notes?: string;
  /** Whether the user has supplied a Resend key for this project (the key
   *  itself is never stored on the backend). */
  resend_configured?: boolean;
  status?: ProjectStatus;
}

export interface Template extends BaseRecord {
  project: string;
  name: string;
  subject: string;
  html: string;
  model?: string;
  prompt?: string;
  selected?: boolean;
}

export type LogStatus = "sent" | "failed" | "queued";

export interface Log extends BaseRecord {
  project: string;
  template?: string;
  recipient: string;
  status: LogStatus;
  error?: string;
  sent_at?: string;
}

/** Result of the backend send route, one entry per recipient. */
export interface SendResult {
  recipient: string;
  status: LogStatus;
  error?: string;
}

export interface SendResponse {
  results: SendResult[];
  sent: number;
  failed: number;
}

/** A template candidate generated in-browser by OpenAI, not yet persisted. */
export interface GeneratedTemplate {
  /** Stable client-side id so React keys survive regeneration. */
  localId: string;
  name: string;
  subject: string;
  html: string;
  model: string;
  prompt: string;
}

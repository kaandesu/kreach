import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Parse a free-text blob of emails (newline/comma/semicolon separated) into a
 *  de-duplicated list of trimmed, syntactically-valid addresses. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmails(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,;]+/)) {
    const email = part.trim().toLowerCase();
    if (email && EMAIL_RE.test(email)) seen.add(email);
  }
  return [...seen];
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

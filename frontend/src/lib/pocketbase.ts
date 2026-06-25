import PocketBase from "pocketbase";

/** PocketBase base URL, configured per-environment. Falls back to the default
 *  local dev port used by `pocketbase serve`. */
export const PB_URL =
  import.meta.env.VITE_PB_URL ?? "http://127.0.0.1:8080";

/** Single shared PocketBase client. Import this everywhere — never construct a
 *  second instance, or the auth store / realtime connection will desync. */
export const pb = new PocketBase(PB_URL);

// React Query owns request lifecycles, so disable the SDK's per-key
// auto-cancellation which would otherwise cancel legitimate parallel reads.
pb.autoCancellation(false);

/** Friendly message extraction from a PocketBase ClientResponseError. */
export function pbError(err: unknown, fallback = "Something went wrong"): string {
  if (err && typeof err === "object") {
    const e = err as {
      message?: string;
      response?: { message?: string; data?: Record<string, { message?: string }> };
    };
    const fieldError = e.response?.data
      ? Object.values(e.response.data).find((f) => f?.message)?.message
      : undefined;
    return fieldError || e.response?.message || e.message || fallback;
  }
  return fallback;
}

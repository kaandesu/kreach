import { useCallback, useSyncExternalStore } from "react";

/**
 * Client-only store for the user's third-party API keys (OpenAI, Resend).
 *
 * Keys live in sessionStorage and in memory ONLY — they are intentionally never
 * sent to or persisted on the Kreach backend. The OpenAI key is used directly
 * from the browser; the Resend key is passed through to the backend send route
 * per-request and not stored there either.
 */
const STORAGE_KEYS = {
  openai: "kreach.openai_key",
  resend: "kreach.resend_key",
} as const;

type KeyName = keyof typeof STORAGE_KEYS;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function read(name: KeyName): string {
  try {
    return sessionStorage.getItem(STORAGE_KEYS[name]) ?? "";
  } catch {
    return "";
  }
}

function write(name: KeyName, value: string) {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEYS[name], value);
    else sessionStorage.removeItem(STORAGE_KEYS[name]);
  } catch {
    /* sessionStorage unavailable (private mode) — keys stay in-memory snapshot */
  }
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useApiKeys() {
  const openaiKey = useSyncExternalStore(
    subscribe,
    () => read("openai"),
    () => "",
  );
  const resendKey = useSyncExternalStore(
    subscribe,
    () => read("resend"),
    () => "",
  );

  const setOpenaiKey = useCallback((v: string) => write("openai", v.trim()), []);
  const setResendKey = useCallback((v: string) => write("resend", v.trim()), []);
  const clear = useCallback(() => {
    write("openai", "");
    write("resend", "");
  }, []);

  return {
    openaiKey,
    resendKey,
    hasOpenaiKey: Boolean(openaiKey),
    hasResendKey: Boolean(resendKey),
    setOpenaiKey,
    setResendKey,
    clear,
  };
}

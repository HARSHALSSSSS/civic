import { API_CONFIG } from "@/config/api";

const BACKEND_ORIGIN = API_CONFIG.UPLOAD_BASE;
const DEFAULT_TIMEOUT_MS = 50_000;
const WARMUP_TIMEOUT_MS = 60_000;

let warmupPromise: Promise<boolean> | null = null;

export type FetchJsonOptions = {
  timeoutMs?: number;
  retries?: number;
  silent?: boolean;
};

export async function fetchJson<T = Record<string, unknown>>(
  url: string,
  init: RequestInit = {},
  options: FetchJsonOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? 1;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      window.clearTimeout(timer);

      let data: Record<string, unknown> | null = null;
      try {
        data = await response.json();
      } catch {
        // empty body
      }

      if (!response.ok) {
        const errors = data?.errors as Array<{ msg?: string }> | undefined;
        const validationMessage = errors?.map((e) => e.msg).filter(Boolean).join(". ");
        const message =
          (typeof data?.message === "string" && data.message) ||
          (typeof data?.error === "string" && data.error) ||
          validationMessage ||
          `Request failed (${response.status})`;
        throw new Error(message);
      }

      return (data ?? {}) as T;
    } catch (error) {
      window.clearTimeout(timer);
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new Error(
          attempt < retries
            ? "Server is waking up, retrying..."
            : "Server took too long to respond. Wait a moment and try again."
        );
      } else if (error instanceof Error) {
        lastError = error;
      } else {
        lastError = new Error("Network error. Check your connection.");
      }

      if (attempt < retries) {
        await new Promise((r) => window.setTimeout(r, 800));
        continue;
      }
    }
  }

  throw lastError ?? new Error("Request failed");
}

/** Ping Render backend so login/signup is faster when the user submits the form. */
export function warmupBackend(force = false): Promise<boolean> {
  if (!force && warmupPromise) return warmupPromise;

  warmupPromise = (async () => {
    try {
      await fetchJson<{ success?: boolean }>(
        `${BACKEND_ORIGIN}/health`,
        { method: "GET" },
        { timeoutMs: WARMUP_TIMEOUT_MS, retries: 2, silent: true }
      );
      return true;
    } catch {
      return false;
    }
  })();

  return warmupPromise;
}

export function getBackendOrigin() {
  return BACKEND_ORIGIN;
}

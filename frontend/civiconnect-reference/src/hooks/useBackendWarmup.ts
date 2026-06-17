import { useEffect, useState } from "react";
import { warmupBackend } from "@/lib/apiFetch";

export type ServerWarmupStatus = "idle" | "warming" | "ready" | "slow";

export function useBackendWarmup() {
  const [status, setStatus] = useState<ServerWarmupStatus>("idle");

  useEffect(() => {
    let cancelled = false;
    setStatus("warming");

    warmupBackend().then((ok) => {
      if (!cancelled) setStatus(ok ? "ready" : "slow");
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const retryWarmup = () => {
    setStatus("warming");
    warmupBackend(true).then((ok) => setStatus(ok ? "ready" : "slow"));
  };

  return { status, retryWarmup };
}

export function serverStatusMessage(status: ServerWarmupStatus): string | null {
  switch (status) {
    case "warming":
      return "Connecting to server… first load can take up to a minute.";
    case "slow":
      return "Server is slow to respond. You can still sign in — please wait after clicking.";
    case "ready":
      return "Server is ready.";
    default:
      return null;
  }
}

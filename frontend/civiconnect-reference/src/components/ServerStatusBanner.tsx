import { Loader2, Wifi, WifiOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ServerWarmupStatus, serverStatusMessage } from "@/hooks/useBackendWarmup";
import { cn } from "@/lib/utils";

interface ServerStatusBannerProps {
  status: ServerWarmupStatus;
  loading?: boolean;
  loadingLabel?: string;
  onRetry?: () => void;
}

export function ServerStatusBanner({
  status,
  loading,
  loadingLabel = "Signing in…",
  onRetry,
}: ServerStatusBannerProps) {
  const message = loading ? loadingLabel : serverStatusMessage(status);

  if (!message && status === "ready" && !loading) return null;

  const isReady = status === "ready" && !loading;

  return (
    <Alert
      className={cn(
        "border",
        loading && "border-primary/30 bg-primary/5",
        isReady && "border-green-200 bg-green-50",
        status === "slow" && !loading && "border-amber-200 bg-amber-50"
      )}
    >
      {loading || status === "warming" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isReady ? (
        <Wifi className="h-4 w-4 text-green-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-amber-600" />
      )}
      <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>{message}</span>
        {status === "slow" && onRetry && !loading && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Retry connection
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

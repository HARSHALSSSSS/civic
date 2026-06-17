import { CheckCircle, Clock, Users, AlertTriangle, XCircle, Send } from "lucide-react";
import { Report, StatusHistoryEntry } from "@/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { status: "Submitted", label: "Submitted", icon: Send },
  { status: "Assigned", label: "Assigned", icon: Users },
  { status: "In Progress", label: "In Progress", icon: Clock },
  { status: "Resolved", label: "Resolved", icon: CheckCircle },
] as const;

const STATUS_ORDER = ["Submitted", "Assigned", "In Progress", "Resolved", "Closed"];

interface StatusTimelineProps {
  status: Report["status"];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  statusHistory?: StatusHistoryEntry[];
  rejectionReason?: string;
  showHistory?: boolean;
  className?: string;
}

export function StatusTimeline({
  status,
  createdAt,
  updatedAt,
  resolvedAt,
  statusHistory,
  rejectionReason,
  showHistory = false,
  className,
}: StatusTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isRejected = status === "Rejected";

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  if (isRejected) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
          <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium">Report was rejected</span>
            {rejectionReason && (
              <p className="text-sm mt-1 opacity-90">{rejectionReason}</p>
            )}
          </div>
        </div>
        {showHistory && statusHistory && statusHistory.length > 0 && (
          <HistoryLog history={statusHistory} formatDate={formatDate} />
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const stepIndex = STATUS_ORDER.indexOf(step.status);
            const isComplete = currentIndex >= stepIndex || status === "Closed";
            const isCurrent = status === step.status || (status === "Closed" && step.status === "Resolved");
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex flex-col items-center flex-1 relative">
                {index < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute top-4 left-1/2 w-full h-0.5 -z-10",
                      isComplete ? "bg-primary" : "bg-border"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                    isComplete
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground",
                    isCurrent && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1.5 text-center font-medium",
                    isComplete ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground pt-2">
          <span>Submitted {createdAt.toLocaleDateString("en-IN")}</span>
          {(resolvedAt || status === "Resolved" || status === "Closed") && (
            <span>Updated {(resolvedAt || updatedAt).toLocaleDateString("en-IN")}</span>
          )}
        </div>
      </div>

      {showHistory && statusHistory && statusHistory.length > 0 && (
        <HistoryLog history={statusHistory} formatDate={formatDate} />
      )}
    </div>
  );
}

function HistoryLog({
  history,
  formatDate,
}: {
  history: StatusHistoryEntry[];
  formatDate: (d: Date) => string;
}) {
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Activity Log
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {sorted.map((entry, i) => (
          <div key={i} className="flex gap-2 text-sm p-2 rounded-lg bg-muted/40 border">
            <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-medium">
                {entry.fromStatus ? (
                  <>
                    {entry.fromStatus} → {entry.toStatus}
                  </>
                ) : (
                  entry.toStatus
                )}
              </p>
              {entry.note && (
                <p className="text-muted-foreground text-xs mt-0.5">{entry.note}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {entry.changedByName && `${entry.changedByName} · `}
                {formatDate(entry.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  ThumbsUp,
  Star,
  Calendar,
  Building2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Report } from "@/types";
import { StatusTimeline } from "@/components/StatusTimeline";
import { getCategoryConfig, PRIORITY_LABELS } from "@/constants/categories";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

interface ReportDetailDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "citizen" | "community" | "admin";
  onReportUpdated?: () => void;
}

export function ReportDetailDialog({
  report,
  open,
  onOpenChange,
  mode,
  onReportUpdated,
}: ReportDetailDialogProps) {
  const { toast } = useToast();
  const [supportCount, setSupportCount] = useState(0);
  const [hasSupported, setHasSupported] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    if (report) {
      setSupportCount(report.supportCount || 0);
      setHasSupported(!!report.hasSupported);
      setFeedbackRating(0);
      setFeedbackComment("");
    }
  }, [report?.id, open]);

  if (!report) return null;

  const categoryConfig = getCategoryConfig(report.category);
  const displayId = report.reportId || report.id.slice(-8).toUpperCase();

  const handleSupport = async () => {
    setSupportLoading(true);
    try {
      const result = await apiService.toggleSupport(report.id);
      setSupportCount(result.supportCount ?? supportCount);
      setHasSupported(result.hasSupported ?? !hasSupported);
      onReportUpdated?.();
      toast({ title: result.hasSupported ? "Issue supported!" : "Support removed" });
    } catch (error: unknown) {
      toast({
        title: "Failed to support",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setSupportLoading(false);
    }
  };

  const handleFeedback = async () => {
    if (feedbackRating < 1) return;
    setFeedbackLoading(true);
    try {
      await apiService.submitFeedback(report.id, feedbackRating, feedbackComment);
      toast({ title: "Thank you for your feedback!" });
      onReportUpdated?.();
    } catch (error: unknown) {
      toast({
        title: "Feedback failed",
        description: error instanceof Error ? error.message : "Try again",
        variant: "destructive",
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const currentSupport = supportCount || report.supportCount || 0;
  const currentHasSupported = hasSupported || report.hasSupported;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-xl">{report.title}</DialogTitle>
              <DialogDescription className="font-mono text-xs mt-1">
                #{displayId}
              </DialogDescription>
            </div>
            <Badge variant="outline">{report.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {mode === "citizen" && (
            <StatusTimeline
              status={report.status}
              createdAt={report.createdAt}
              updatedAt={report.updatedAt}
              resolvedAt={report.resolvedAt}
              statusHistory={report.statusHistory}
              rejectionReason={report.rejectionReason}
              showHistory
            />
          )}

          {(report.photoUrls?.length || report.photoUrl) && (
            <div className="grid grid-cols-2 gap-2">
              {(report.photoUrls || [report.photoUrl]).filter(Boolean).map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Evidence ${i + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground leading-relaxed">{report.description}</p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
              <span className="text-lg">{categoryConfig?.icon || "📋"}</span>
              <div>
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{report.category}</p>
                {report.subcategory && (
                  <p className="text-xs text-muted-foreground">{report.subcategory}</p>
                )}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Priority</p>
              <p className={cn("font-medium", report.priority >= 4 ? "text-destructive" : "")}>
                P{report.priority} — {PRIORITY_LABELS[report.priority]}
              </p>
            </div>
            {categoryConfig && (
              <div className="col-span-2 flex items-center gap-2 p-2 rounded-lg bg-primary/5">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm">Routed to: <strong>{categoryConfig.department}</strong></span>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 text-sm p-3 rounded-lg border">
            <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p>{report.location.address}</p>
              {report.location.landmark && (
                <p className="text-muted-foreground text-xs mt-0.5">
                  Near: {report.location.landmark}
                </p>
              )}
            </div>
          </div>

          {report.staffComments && report.staffComments.length > 0 && mode === "citizen" && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Official Updates</p>
              {report.staffComments.map((c, i) => (
                <div key={i} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm">{c.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.staffName && `${c.staffName} · `}
                    {c.createdAt.toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {report.rejectionReason && report.status === "Rejected" && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-semibold text-destructive mb-1">Rejection Reason</p>
              <p className="text-sm">{report.rejectionReason}</p>
            </div>
          )}

          {report.resolutionDetails && (
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm font-semibold text-success mb-1">Resolution</p>
              <p className="text-sm">{report.resolutionDetails}</p>
            </div>
          )}

          {report.estimatedResolutionDate && report.status !== "Resolved" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Estimated resolution: {report.estimatedResolutionDate.toLocaleDateString("en-IN")}
            </div>
          )}

          {mode === "community" && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{currentSupport} citizens support this</span>
              </div>
              <Button
                variant={currentHasSupported ? "secondary" : "civic"}
                size="sm"
                onClick={handleSupport}
                disabled={supportLoading}
              >
                {supportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : currentHasSupported ? (
                  "Supported ✓"
                ) : (
                  "Support Issue"
                )}
              </Button>
            </div>
          )}

          {mode === "citizen" && report.status === "Resolved" && !report.citizenFeedback?.rating && (
            <>
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Star className="h-4 w-4 text-warning" />
                  Rate resolution quality
                </p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={cn(
                          "h-6 w-6",
                          star <= feedbackRating
                            ? "fill-warning text-warning"
                            : "text-muted-foreground"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="Optional feedback for the department..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  rows={2}
                />
                <Button
                  variant="civic"
                  size="sm"
                  onClick={handleFeedback}
                  disabled={feedbackRating < 1 || feedbackLoading}
                >
                  {feedbackLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit Feedback
                </Button>
              </div>
            </>
          )}

          {report.citizenFeedback?.rating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              You rated this resolution {report.citizenFeedback.rating}/5
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

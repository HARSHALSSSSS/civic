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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Users,
  MessageSquare,
  Loader2,
  Building2,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Sparkles,
} from "lucide-react";
import { Report, StaffMember, StaffReportUpdate } from "@/types";
import { StatusTimeline } from "@/components/StatusTimeline";
import { getCategoryConfig, PRIORITY_LABELS } from "@/constants/categories";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/apiService";

const STATUS_OPTIONS = [
  "Submitted",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
  "Rejected",
] as const;

const QUICK_ACTIONS: Array<{ status: Report["status"]; label: string; icon: typeof Clock }> = [
  { status: "Assigned", label: "Assign", icon: Users },
  { status: "In Progress", label: "Start Work", icon: Clock },
  { status: "Resolved", label: "Resolve", icon: CheckCircle },
  { status: "Rejected", label: "Reject", icon: XCircle },
];

interface AdminReportPanelProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (reportId: string, updates: StaffReportUpdate) => Promise<void>;
}

export function AdminReportPanel({ report, open, onOpenChange, onSave }: AdminReportPanelProps) {
  const [newStatus, setNewStatus] = useState("");
  const [priority, setPriority] = useState(3);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [staffComment, setStaffComment] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (report && open) {
      setNewStatus(report.status);
      setPriority(report.priority);
      setAssignStaffId(report.assignedStaffId || "");
      setStaffComment("");
      setStatusNote("");
      setResolutionDetails(report.resolutionDetails || "");
      setRejectionReason(report.rejectionReason || "");
      setEstimatedDate(
        report.estimatedResolutionDate
          ? report.estimatedResolutionDate.toISOString().split("T")[0]
          : ""
      );
      setActiveTab("overview");
    }
  }, [report?.id, open]);

  useEffect(() => {
    if (open) {
      apiService
        .getStaffMembers()
        .then((data) => {
          const members = (data.members as Array<Record<string, unknown>>) || [];
          setStaffMembers(
            members.map((m) => ({
              id: String(m._id || m.id),
              name: String(m.name),
              email: String(m.email),
              department: m.department as string | undefined,
              role: String(m.role),
              staffId: m.staffId as string | undefined,
            }))
          );
        })
        .catch(() => setStaffMembers([]));
    }
  }, [open]);

  if (!report) return null;

  const categoryConfig = getCategoryConfig(report.category);
  const displayId = report.reportId || report.id.slice(-8).toUpperCase();
  const currentUser = apiService.getCurrentUser();

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const handleQuickAction = (status: Report["status"]) => {
    setNewStatus(status);
    setActiveTab("workflow");
  };

  const handleAssignSelf = async () => {
    setSaving(true);
    try {
      await onSave(report.id, { assignSelf: true });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (newStatus === "Rejected" && !rejectionReason.trim() && !resolutionDetails.trim()) {
      return;
    }

    setSaving(true);
    try {
      const updates: StaffReportUpdate = {};

      if (assignStaffId && assignStaffId !== report.assignedStaffId) {
        updates.assignStaffId = assignStaffId;
      }

      if (priority !== report.priority) {
        updates.priority = priority;
      }

      if (newStatus && newStatus !== report.status) {
        updates.status = newStatus as Report["status"];
        updates.resolutionDetails = resolutionDetails.trim() || undefined;
        updates.rejectionReason = rejectionReason.trim() || undefined;
        updates.statusNote = statusNote.trim() || undefined;
        updates.estimatedResolutionDate = estimatedDate || undefined;
      } else if (resolutionDetails.trim() !== (report.resolutionDetails || "")) {
        updates.status = report.status;
        updates.resolutionDetails = resolutionDetails.trim();
        updates.estimatedResolutionDate = estimatedDate || undefined;
      } else if (estimatedDate) {
        updates.status = report.status;
        updates.estimatedResolutionDate = estimatedDate;
      }

      if (staffComment.trim()) {
        updates.staffComment = staffComment.trim();
      }

      const hasChanges =
        updates.assignStaffId ||
        updates.priority ||
        updates.status ||
        updates.staffComment ||
        (updates.estimatedResolutionDate && !updates.status);

      if (hasChanges) {
        await onSave(report.id, updates);
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed":
        return "bg-green-100 text-green-700 border-green-200";
      case "In Progress":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Assigned":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                Report #{displayId}
                <Badge className={cn("text-xs", getStatusColor(report.status))}>
                  {report.status}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  P{report.priority}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Submitted {formatDate(report.createdAt)}
                {report.citizenName && ` · by ${report.citizenName}`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <StatusTimeline
              status={report.status}
              createdAt={report.createdAt}
              updatedAt={report.updatedAt}
              resolvedAt={report.resolvedAt}
              statusHistory={report.statusHistory}
              rejectionReason={report.rejectionReason}
            />

            <div>
              <h3 className="font-semibold text-lg">{report.title}</h3>
              <p className="text-muted-foreground mt-1">{report.description}</p>
            </div>

            {(report.photoUrls?.length || report.photoUrl) && (
              <div className="grid grid-cols-2 gap-2">
                {(report.photoUrls || [report.photoUrl]).filter(Boolean).map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Evidence ${i + 1}`}
                    className="w-full h-36 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Category</p>
                <p className="font-medium">{report.category}</p>
                {report.subcategory && (
                  <p className="text-xs text-muted-foreground">{report.subcategory}</p>
                )}
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Priority</p>
                <p className="font-medium">
                  P{report.priority} — {PRIORITY_LABELS[report.priority]}
                </p>
              </div>
              {categoryConfig && (
                <div className="col-span-2 flex items-center gap-2 p-3 rounded-lg bg-primary/5">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>
                    Department: <strong>{categoryConfig.department}</strong>
                  </span>
                </div>
              )}
              {report.assignedStaffName && (
                <div className="col-span-2 flex items-center gap-2 p-3 rounded-lg border">
                  <User className="h-4 w-4 text-primary" />
                  <span>
                    Assigned to: <strong>{report.assignedStaffName}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg border text-sm">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p>{report.location.address}</p>
                {report.location.landmark && (
                  <p className="text-muted-foreground text-xs">Near: {report.location.landmark}</p>
                )}
              </div>
            </div>

            {report.aiSuggestions && (
              <div className="p-3 rounded-lg bg-violet-50 border border-violet-100 text-sm">
                <p className="font-medium flex items-center gap-1 text-violet-800">
                  <Sparkles className="h-4 w-4" /> AI Analysis
                </p>
                <p className="text-violet-700 mt-1">
                  Suggested: {report.aiSuggestions.suggestedCategory} · P
                  {report.aiSuggestions.suggestedPriority}
                  {report.aiSuggestions.confidence != null &&
                    ` (${Math.round(report.aiSuggestions.confidence * 100)}% confidence)`}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map(({ status, label, icon: Icon }) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAction(status)}
                  disabled={report.status === status}
                >
                  <Icon className="h-3.5 w-3.5 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-5 mt-4">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" /> Assignment
              </h3>
              <div className="flex flex-wrap gap-2">
                {!report.assignedStaffId && (
                  <Button variant="outline" size="sm" onClick={handleAssignSelf} disabled={saving}>
                    Assign to Me
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Assign to Official</Label>
                <Select value={assignStaffId || "unassigned"} onValueChange={(v) => setAssignStaffId(v === "unassigned" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">— Unassigned —</SelectItem>
                    {staffMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                        {m.department ? ` (${m.department})` : ""}
                        {m.id === currentUser?.id ? " — You" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Priority & Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select value={String(priority)} onValueChange={(v) => setPriority(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((p) => (
                        <SelectItem key={p} value={String(p)}>
                          P{p} — {PRIORITY_LABELS[p as 1 | 2 | 3 | 4 | 5]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Update Note (sent to citizen)</Label>
                <Textarea
                  placeholder="Brief note about this status change..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" /> Timeline & Resolution
              </h3>
              <div className="space-y-2">
                <Label>Estimated Resolution Date</Label>
                <Input
                  type="date"
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                />
              </div>

              {(newStatus === "Resolved" || newStatus === "Closed") && (
                <div className="space-y-2">
                  <Label>Resolution Details *</Label>
                  <Textarea
                    placeholder="Describe actions taken to resolve this issue..."
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {newStatus === "Rejected" && (
                <div className="space-y-2">
                  <Label>Rejection Reason *</Label>
                  <Textarea
                    placeholder="Explain why this report cannot be processed..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" /> Official Comment (visible to citizen)
              </Label>
              <Textarea
                placeholder="Add a progress update for the citizen..."
                value={staffComment}
                onChange={(e) => setStaffComment(e.target.value)}
                rows={3}
              />
            </div>

            <Button variant="civic" className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Save All Changes
            </Button>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <StatusTimeline
              status={report.status}
              createdAt={report.createdAt}
              updatedAt={report.updatedAt}
              resolvedAt={report.resolvedAt}
              statusHistory={report.statusHistory}
              rejectionReason={report.rejectionReason}
              showHistory
            />

            {report.staffComments && report.staffComments.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Official Comments</h3>
                {report.staffComments.map((c, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-sm">{c.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {c.staffName && `${c.staffName} · `}
                      {formatDate(c.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(!report.statusHistory || report.statusHistory.length === 0) &&
              (!report.staffComments || report.staffComments.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No activity yet. Use the Workflow tab to assign and update this report.
                </p>
              )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

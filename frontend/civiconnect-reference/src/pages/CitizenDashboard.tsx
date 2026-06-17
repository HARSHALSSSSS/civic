import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Clock, CheckCircle, AlertTriangle, Search, MapPin, Plus,
  Eye, ThumbsUp, TrendingUp, Filter,
} from "lucide-react";
import { Report } from "@/types";
import { cn } from "@/lib/utils";
import { ReportDetailDialog } from "@/components/ReportDetailDialog";
import { getCategoryConfig, REPORT_CATEGORIES } from "@/constants/categories";

interface CitizenDashboardProps {
  reports: Report[];
  communityReports?: Report[];
  userId: string;
  onNavigate: (page: string) => void;
  onRefresh?: () => void;
}

export const CitizenDashboard = ({
  reports,
  communityReports = [],
  userId,
  onNavigate,
  onRefresh,
}: CitizenDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailMode, setDetailMode] = useState<"citizen" | "community">("citizen");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filterReports = (list: Report[]) => {
    let filtered = list;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.reportId || r.id).toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") filtered = filtered.filter((r) => r.status === statusFilter);
    if (categoryFilter !== "all") filtered = filtered.filter((r) => r.category === categoryFilter);
    return filtered;
  };

  const filteredMyReports = useMemo(() => filterReports(reports), [reports, searchTerm, statusFilter, categoryFilter]);
  const filteredCommunity = useMemo(() => filterReports(communityReports), [communityReports, searchTerm, statusFilter, categoryFilter]);

  const openDetail = (report: Report, mode: "citizen" | "community") => {
    setSelectedReport(report);
    setDetailMode(mode);
    setDialogOpen(true);
  };

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "Submitted").length,
    inProgress: reports.filter((r) => r.status === "In Progress" || r.status === "Assigned").length,
    resolved: reports.filter((r) => r.status === "Resolved" || r.status === "Closed").length,
  };

  const getStatusColor = (status: Report["status"]) => {
    switch (status) {
      case "Resolved": case "Closed": return "bg-success text-success-foreground";
      case "In Progress": return "bg-warning text-warning-foreground";
      case "Assigned": return "bg-primary text-primary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);

  const renderReportCard = (report: Report, mode: "citizen" | "community") => {
    const catConfig = getCategoryConfig(report.category);
    return (
      <Card
        key={report.id}
        className="hover:shadow-md transition-all cursor-pointer group border-border/60"
        onClick={() => openDetail(report, mode)}
      >
        <CardContent className="p-5">
          <div className="flex gap-4">
            {report.photoUrl ? (
              <img src={report.photoUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">
                {catConfig?.icon || "📋"}
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-muted-foreground">
                      #{report.reportId || report.id.slice(-6).toUpperCase()}
                    </span>
                    <Badge variant="outline" className="text-[10px]">{report.category}</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {report.title}
                  </h3>
                </div>
                <Badge className={cn("text-[10px] shrink-0", getStatusColor(report.status))}>
                  {report.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {report.description || "Community issue — tap to view and support"}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{report.location.address?.slice(0, 30)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(report.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {mode === "community" && (report.supportCount ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-primary"><ThumbsUp className="h-3 w-3" />{report.supportCount}</span>
                  )}
                  <Eye className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              {mode === "citizen" && report.staffComment && (
                <div className="text-xs p-2 rounded bg-primary/5 text-primary border border-primary/10">
                  Official update: {report.staffComment}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FilterBar = () => (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title, ID, category..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-8 text-xs"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {["Submitted", "Assigned", "In Progress", "Resolved", "Closed"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {REPORT_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Civic Dashboard</h1>
          <p className="text-muted-foreground">Track your reports and community issues</p>
        </div>
        <Button variant="civic" onClick={() => onNavigate("report")}>
          <Plus className="h-4 w-4 mr-2" /> New Report
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Reports", value: stats.total, icon: AlertTriangle, color: "text-primary" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-muted-foreground" },
          { label: "In Progress", value: stats.inProgress, icon: TrendingUp, color: "text-warning" },
          { label: "Resolved", value: stats.resolved, icon: CheckCircle, color: "text-success" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={cn("h-8 w-8", color)} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="my-reports">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-reports">My Reports ({reports.length})</TabsTrigger>
          <TabsTrigger value="community">Community ({communityReports.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-reports" className="mt-4 space-y-4">
          <FilterBar />
          {filteredMyReports.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">No reports found</p>
              {reports.length === 0 && (
                <Button variant="civic" className="mt-4" onClick={() => onNavigate("report")}>Create First Report</Button>
              )}
            </CardContent></Card>
          ) : (
            filteredMyReports.map((r) => renderReportCard(r, "citizen"))
          )}
        </TabsContent>

        <TabsContent value="community" className="mt-4 space-y-4">
          <FilterBar />
          <p className="text-sm text-muted-foreground">Support issues affecting your neighborhood — your voice helps prioritize fixes.</p>
          {filteredCommunity.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No community issues match your filters.</CardContent></Card>
          ) : (
            filteredCommunity.map((r) => renderReportCard(r, "community"))
          )}
        </TabsContent>
      </Tabs>

      <ReportDetailDialog
        report={selectedReport}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={detailMode}
        onReportUpdated={onRefresh}
      />
    </div>
  );
};

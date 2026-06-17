import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users,
  Search,
  Filter,
  TrendingUp,
  Eye,
  BarChart3,
  PieChart,
  TrendingDown,
  Briefcase,
  Loader2,
  ThumbsUp
} from "lucide-react";
import { Report, StaffReportUpdate } from "@/types";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart
} from "recharts";
import { NotificationBell } from "@/components/NotificationBell";
import { RealtimeMapDashboard } from "@/components/RealtimeMapDashboard";
import { AdminReportPanel } from "@/components/AdminReportPanel";
import { apiService } from "@/services/apiService";
import { API_CONFIG } from "@/config/api";
import { REPORT_CATEGORIES } from "@/constants/categories";

interface AnalyticsData {
  summary: {
    totalReports: number;
    totalResolved: number;
    totalRejected: number;
    resolutionRate: number;
    avgPriority: number;
    highPriorityCount: number;
  };
  byCategory: Array<{ category: string; count: number; avgPriority: number }>;
  byStatus: Array<{ status: string; count: number; avgPriority: number }>;
  monthlyTrends: Array<{ year: number; month: number; monthName: string; count: number; resolved: number; avgPriority: number }>;
  resolutionTimeByCategory: Array<{ category: string; avgResolutionHours: number; count: number }>;
  byPriority: Array<{ priority: number; count: number }>;
  topSupported: Array<{ reportId: string; title: string; category: string; supportCount: number; status: string }>;
  staffPerformance: Array<{
    staffName: string;
    staffDepartment: string;
    assignedCount: number;
    resolvedCount: number;
    avgResolutionHours: number;
    resolutionRate: number;
  }>;
}

interface AdminDashboardProps {
  reports: Report[];
  onUpdateReport: (reportId: string, updates: StaffReportUpdate) => Promise<void>;
  token?: string;
  onRefresh?: () => void;
}

interface StaffDashboardData {
  pendingCount: number;
  overdueCount: number;
  statusCounts: Array<{ _id: string; count: number }>;
  assignedReports: Array<Record<string, unknown>>;
  recentActivity: Array<Record<string, unknown>>;
  isAdmin: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminDashboard = ({ reports, onUpdateReport, token, onRefresh }: AdminDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [staffDashboard, setStaffDashboard] = useState<StaffDashboardData | null>(null);
  const [opsLoading, setOpsLoading] = useState(false);

  // Fetch analytics data
  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await apiService.getAdvancedAnalytics();
      if (data.success) setAnalytics(data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...reports].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (searchTerm.trim()) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.reportId || report.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(report => report.priority === parseInt(priorityFilter));
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(report => report.category === categoryFilter);
    }

    setFilteredReports(filtered);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, reports]);

  const fetchStaffDashboard = async () => {
    setOpsLoading(true);
    try {
      const data = await apiService.getStaffDashboard();
      if (data.success) setStaffDashboard(data.data as StaffDashboardData);
    } catch (error) {
      console.error("Failed to fetch operations data:", error);
    } finally {
      setOpsLoading(false);
    }
  };

  const openReportPanel = (report: Report) => {
    setSelectedReport(report);
    setPanelOpen(true);
  };

  const getStatusIcon = (status: Report["status"]) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "In Progress":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "Assigned":
        return <Users className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Report["status"]) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-700 border-green-200";
      case "In Progress":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Assigned":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Submitted":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return "text-red-600";
    if (priority >= 3) return "text-amber-600";
    return "text-green-600";
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "Submitted").length,
    assigned: reports.filter(r => r.status === "Assigned").length,
    inProgress: reports.filter(r => r.status === "In Progress").length,
    resolved: reports.filter(r => r.status === "Resolved").length,
    highPriority: reports.filter(r => r.priority >= 4).length
  };

  // Calculate analytics from local data if API not available
  const localAnalytics = analytics || {
    summary: {
      totalReports: stats.total,
      totalResolved: stats.resolved,
      resolutionRate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(2) : 0,
      avgPriority: reports.length > 0 ? (reports.reduce((a, r) => a + r.priority, 0) / reports.length).toFixed(1) : 0,
      highPriorityCount: stats.highPriority
    },
    byCategory: Object.entries(
      reports.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([category, count]) => ({ category, count, avgPriority: 0 })),
    byStatus: ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Closed'].map(status => ({
      status,
      count: reports.filter(r => r.status === status).length,
      avgPriority: 0
    })),
    monthlyTrends: [],
    resolutionTimeByCategory: [],
    byPriority: [1, 2, 3, 4, 5].map(p => ({
      priority: p,
      count: reports.filter(r => r.priority === p).length
    })),
    topSupported: [],
    staffPerformance: []
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Government Portal</h1>
          <p className="text-muted-foreground">Manage civic reports, assign teams, and track resolution</p>
        </div>
        <div className="flex items-center gap-3">
          {token && <NotificationBell token={token} apiUrl={API_CONFIG.BASE_URL.replace('/api', '')} />}
          <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-4 py-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold text-primary">{reports.length} Active Reports</p>
              <p className="text-xs text-muted-foreground">{stats.pending} awaiting action</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
                <p className="text-xs text-gray-500">Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
                <p className="text-xs text-gray-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
                <p className="text-xs text-gray-500">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => {
          setActiveTab(tab);
          if (tab === "map" || tab === "reports") onRefresh?.();
          if (tab === "overview" || tab === "categories" || tab === "trends") fetchAnalytics();
          if (tab === "operations") fetchStaffDashboard();
        }}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="map">Map View</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Resolution Rate Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Resolution Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#10b981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(Number(localAnalytics.summary.resolutionRate) / 100) * 352} 352`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {localAnalytics.summary.resolutionRate}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Resolved:</span>
                    <span className="ml-1 font-semibold text-green-600">{localAnalytics.summary.totalResolved}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-1 font-semibold text-gray-900">{localAnalytics.summary.totalReports}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={localAnalytics.byStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="status" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Supported Reports */}
            {localAnalytics.topSupported.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThumbsUp className="h-5 w-5 text-red-500" />
                    Most Supported Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {localAnalytics.topSupported.slice(0, 5).map((report, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{report.title}</p>
                          <p className="text-sm text-gray-500">{report.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-red-500" />
                          <span className="font-semibold">{report.supportCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          {opsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4" /> Queue
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50">
                    <span className="text-sm">Awaiting Action</span>
                    <span className="text-2xl font-bold text-amber-700">
                      {staffDashboard?.pendingCount ?? stats.pending + stats.assigned}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-red-50">
                    <span className="text-sm">Overdue (past ETA)</span>
                    <span className="text-2xl font-bold text-red-700">
                      {staffDashboard?.overdueCount ?? 0}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(staffDashboard?.statusCounts || localAnalytics.byStatus.map((s) => ({ _id: s.status, count: s.count }))).map((item) => (
                      <div key={item._id} className="p-3 rounded-lg border text-center">
                        <p className="text-xs text-muted-foreground">{item._id}</p>
                        <p className="text-xl font-bold">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Latest report updates across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(staffDashboard?.recentActivity?.length
                      ? staffDashboard.recentActivity
                      : reports.slice(0, 8)
                    ).map((item, i) => {
                      const r = item as Record<string, unknown>;
                      const title = String(r.title || "Report");
                      const status = String(r.status || "");
                      const id = String(r._id || r.id || i);
                      return (
                        <div
                          key={id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            const match = reports.find((rep) => rep.id === id);
                            if (match) openReportPanel(match);
                          }}
                        >
                          <div>
                            <p className="font-medium text-sm truncate max-w-xs">{title}</p>
                            <p className="text-xs text-muted-foreground">{status}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Reports by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={localAnalytics.byCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, count }) => `${category}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {localAnalytics.byCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Average Resolution Time by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Avg Resolution Time by Category (hours)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={localAnalytics.resolutionTimeByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="avgResolutionHours" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Report Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={localAnalytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      name="Total Reports"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.3}
                      name="Resolved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="space-y-4 mt-4">
          {activeTab === "map" && (
            <RealtimeMapDashboard token={token || ""} reports={reports} />
          )}
        </TabsContent>

        <TabsContent value="reports">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by ID, title, category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Assigned">Assigned</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="5">P5 - Critical</SelectItem>
                      <SelectItem value="4">P4 - High</SelectItem>
                      <SelectItem value="3">P3 - Medium</SelectItem>
                      <SelectItem value="2">P2 - Low</SelectItem>
                      <SelectItem value="1">P1 - Very Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {REPORT_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Reports ({filteredReports.length})</CardTitle>
              <CardDescription>
                All civic issue reports sorted by creation date
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium">Report ID</th>
                      <th className="text-left p-4 font-medium">Title</th>
                      <th className="text-left p-4 font-medium">Category</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <span className="font-mono text-sm">
                            {report.reportId || report.id.slice(-8).toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{report.title}</p>
                            <p className="text-sm text-gray-500 truncate">
                              {report.description}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className="text-xs">
                            {report.category}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className={cn("font-medium", getPriorityColor(report.priority))}>
                            P{report.priority}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge className={cn("text-xs", getStatusColor(report.status))}>
                            {getStatusIcon(report.status)}
                            <span className="ml-1">{report.status}</span>
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(report.createdAt)}
                        </td>
                        <td className="p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openReportPanel(report)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AdminReportPanel
        report={selectedReport}
        open={panelOpen}
        onOpenChange={(open) => {
          setPanelOpen(open);
          if (!open) setSelectedReport(null);
        }}
        onSave={async (reportId, updates) => {
          await onUpdateReport(reportId, updates);
          onRefresh?.();
        }}
      />
    </div>
  );
};

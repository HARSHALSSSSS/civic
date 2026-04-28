import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  MessageSquare,
  ThumbsUp,
  BarChart3,
  PieChart,
  TrendingDown
} from "lucide-react";
import { Report } from "@/types";
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
  onUpdateReport: (reportId: string, updates: Partial<Report>) => void;
  token?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const AdminDashboard = ({ reports, onUpdateReport, token }: AdminDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [staffComment, setStaffComment] = useState("");
  const [realtimeCount, setRealtimeCount] = useState(reports.length);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Fetch analytics data
  useEffect(() => {
    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/reports/analytics/advanced', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldUpdate = Math.random() > 0.7;
      if (shouldUpdate) {
        setRealtimeCount(prev => prev + Math.floor(Math.random() * 2));
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = [...reports].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (searchTerm.trim()) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(report => report.priority === parseInt(priorityFilter));
    }

    setFilteredReports(filtered);
  }, [searchTerm, statusFilter, priorityFilter, reports]);

  const handleUpdateReport = () => {
    if (!selectedReport || !newStatus) return;

    const updates: Partial<Report> = {
      status: newStatus as Report["status"],
      updatedAt: new Date(),
    };

    if (staffComment.trim()) {
      updates.staffComment = staffComment.trim();
      updates.assignedStaffId = "staff1";
    }

    onUpdateReport(selectedReport.id, updates);
    setSelectedReport(null);
    setNewStatus("");
    setStaffComment("");
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Manage and respond to civic issue reports</p>
        </div>
        <div className="flex items-center gap-4">
          {token && <NotificationBell token={token} />}
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg p-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-600">Live Updates</p>
              <p className="text-xs text-gray-500">{realtimeCount} total reports</p>
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
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
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

        <TabsContent value="map" className="space-y-4">
          <RealtimeMapDashboard token={token || ""} />
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
                          <span className="font-mono text-sm">{report.id}</span>
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setNewStatus(report.status);
                                  setStaffComment(report.staffComment || "");
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              {selectedReport && (
                                <>
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <span>Report #{selectedReport.id}</span>
                                      <Badge className={cn("text-xs", getStatusColor(selectedReport.status))}>
                                        {selectedReport.status}
                                      </Badge>
                                    </DialogTitle>
                                    <DialogDescription>
                                      Submitted on {formatDate(selectedReport.createdAt)}
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="space-y-6">
                                    <div className="space-y-4">
                                      <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Issue Details</h3>
                                        <h4 className="font-medium text-lg">{selectedReport.title}</h4>
                                        <p className="text-gray-600 mt-1">{selectedReport.description}</p>
                                      </div>

                                      {selectedReport.photoUrl && (
                                        <div>
                                          <h4 className="font-medium mb-2">Photo Evidence</h4>
                                          <img 
                                            src={selectedReport.photoUrl} 
                                            alt="Issue photo" 
                                            className="w-full h-48 object-cover rounded-lg border"
                                          />
                                        </div>
                                      )}

                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium">Category:</span>
                                          <p className="text-gray-600">{selectedReport.category}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium">Priority:</span>
                                          <p className={cn("font-medium", getPriorityColor(selectedReport.priority))}>
                                            P{selectedReport.priority}
                                          </p>
                                        </div>
                                        <div className="col-span-2">
                                          <span className="font-medium">Location:</span>
                                          <p className="text-gray-600">{selectedReport.location.address}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t">
                                      <h3 className="font-semibold text-gray-900">Update Status</h3>
                                      
                                      <div className="space-y-2">
                                        <Label htmlFor="status">New Status</Label>
                                        <Select value={newStatus} onValueChange={setNewStatus}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="Submitted">Submitted</SelectItem>
                                            <SelectItem value="Assigned">Assigned</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Resolved">Resolved</SelectItem>
                                            <SelectItem value="Closed">Closed</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div className="space-y-2">
                                        <Label htmlFor="comment">Staff Comment</Label>
                                        <Textarea
                                          id="comment"
                                          placeholder="Add a comment about the status update..."
                                          value={staffComment}
                                          onChange={(e) => setStaffComment(e.target.value)}
                                          rows={3}
                                        />
                                      </div>

                                      <Button 
                                        variant="default"
                                        onClick={handleUpdateReport}
                                        className="w-full"
                                        disabled={!newStatus || newStatus === selectedReport.status}
                                      >
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Update Report
                                      </Button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </DialogContent>
                          </Dialog>
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
    </div>
  );
};

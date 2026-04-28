import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const reportsByCategory = [
  { category: "Pothole", count: 245 },
  { category: "Waste", count: 189 },
  { category: "Light", count: 156 },
  { category: "Water", count: 134 },
  { category: "Traffic", count: 98 },
  { category: "Other", count: 67 }
];

const statusDistribution = [
  { name: "Resolved", value: 425, color: "#22c55e" },
  { name: "In Progress", value: 189, color: "#3b82f6" },
  { name: "Assigned", value: 156, color: "#f59e0b" },
  { name: "Submitted", value: 119, color: "#6366f1" }
];

const monthlyTrends = [
  { month: "Jan", reports: 78 },
  { month: "Feb", reports: 92 },
  { month: "Mar", reports: 115 },
  { month: "Apr", reports: 103 },
  { month: "May", reports: 134 },
  { month: "Jun", reports: 167 }
];

const resolutionTimeData = [
  { category: "Pothole", avgDays: 3.2 },
  { category: "Waste", avgDays: 2.8 },
  { category: "Light", avgDays: 4.1 },
  { category: "Water", avgDays: 5.5 },
  { category: "Traffic", avgDays: 6.2 },
  { category: "Other", avgDays: 4.8 }
];

export const PublicAnalytics = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">City-Wide Impact Analytics</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Transparency in civic reporting: See how our community is making a difference
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-primary">889</div>
            <div className="text-sm text-muted-foreground mt-1">Total Reports</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-success text-sm">
              <TrendingUp className="h-3 w-3" />
              <span>+12% this month</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-success">425</div>
            <div className="text-sm text-muted-foreground mt-1">Resolved</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-success text-sm">
              <CheckCircle className="h-3 w-3" />
              <span>48% resolution</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-secondary">345</div>
            <div className="text-sm text-muted-foreground mt-1">In Progress</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-secondary text-sm">
              <Clock className="h-3 w-3" />
              <span>Being addressed</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-warning">119</div>
            <div className="text-sm text-muted-foreground mt-1">Pending</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-warning text-sm">
              <AlertCircle className="h-3 w-3" />
              <span>Awaiting action</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Reports by Category
            </CardTitle>
            <CardDescription>
              Distribution of civic issues by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportsByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-secondary" />
              Status Distribution
            </CardTitle>
            <CardDescription>
              Current status of all reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Monthly Trends
            </CardTitle>
            <CardDescription>
              Number of reports submitted over the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="reports" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Average Resolution Time
            </CardTitle>
            <CardDescription>
              Average days to resolve issues by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={resolutionTimeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} unit=" days" />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px"
                  }}
                  formatter={(value) => [`${value} days`, "Avg Resolution"]}
                />
                <Bar dataKey="avgDays" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

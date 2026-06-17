import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend,
} from "recharts";
import { apiService } from "@/services/apiService";
import { REPORT_CATEGORIES } from "@/constants/categories";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export const PublicAnalytics = () => {
  const [stats, setStats] = useState<{ total: number; pending: number; inProgress: number; resolved: number; closed: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getAnalyticsStats()
      .then((data) => {
        if (data.success && data.data) setStats(data.data);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const statusData = stats
    ? [
        { name: "Resolved", value: stats.resolved, color: "#22c55e" },
        { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
        { name: "Pending", value: stats.pending, color: "#6366f1" },
        { name: "Closed", value: stats.closed, color: "#94a3b8" },
      ].filter((d) => d.value > 0)
    : [];

  const resolutionRate = stats && stats.total > 0
    ? Math.round(((stats.resolved + stats.closed) / stats.total) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">City-Wide Impact Analytics</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Live transparency data from the Civiconnect platform
        </p>
      </div>

      {!stats ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <AlertCircle className="h-10 w-10 mx-auto mb-3" />
            Unable to load analytics. Ensure the backend is running.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Reports", value: stats.total, icon: BarChart3, color: "text-primary" },
              { label: "Pending", value: stats.pending, icon: Clock, color: "text-muted-foreground" },
              { label: "In Progress", value: stats.inProgress, icon: TrendingUp, color: "text-warning" },
              { label: "Resolved", value: stats.resolved + stats.closed, icon: CheckCircle, color: "text-success" },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="p-6 flex items-center gap-4">
                  <Icon className={`h-8 w-8 ${color}`} />
                  <div>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" /> Resolution Rate
                </CardTitle>
                <CardDescription>{resolutionRate}% of reported issues resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-4">
                  <div className="relative">
                    <svg className="w-36 h-36 -rotate-90">
                      <circle cx="72" cy="72" r="64" stroke="hsl(var(--border))" strokeWidth="14" fill="none" />
                      <circle
                        cx="72" cy="72" r="64"
                        stroke="hsl(var(--success))"
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={`${(resolutionRate / 100) * 402} 402`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                      {resolutionRate}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {statusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground pt-20">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report Categories Available</CardTitle>
              <CardDescription>Citizens can report across {REPORT_CATEGORIES.length} issue categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {REPORT_CATEGORIES.map((cat) => (
                  <div key={cat.value} className="p-3 rounded-lg border text-center hover:border-primary/50 transition-colors">
                    <span className="text-2xl">{cat.icon}</span>
                    <p className="text-xs font-medium mt-1">{cat.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

import { useState, useEffect, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { ReportIssue } from "@/pages/ReportIssue";
import { CitizenDashboard } from "@/pages/CitizenDashboard";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { AboutUs } from "@/pages/AboutUs";
import { PublicAnalytics } from "@/pages/PublicAnalytics";
import { HelpFAQ } from "@/pages/HelpFAQ";
import { ProfileSettings } from "@/pages/ProfileSettings";
import { apiService } from "@/services/apiService";
import { transformBackendReport } from "@/lib/reportUtils";
import { Report, StaffReportUpdate } from "@/types";

interface User {
  id: string;
  name: string;
  role: "citizen" | "staff";
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [communityReports, setCommunityReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadReports = useCallback(async (currentUser?: User) => {
    const userToCheck = currentUser || user;
    if (!userToCheck || !apiService.isAuthenticated()) return;

    try {
      let response;
      if (userToCheck.role === "citizen") {
        response = await apiService.getMyReports();
      } else {
        response = await apiService.getAdminReports();
      }

      if (response.success && response.reports) {
        setReports(response.reports.map(transformBackendReport));
      } else {
        setReports([]);
      }

      if (userToCheck.role === "citizen") {
        try {
          const communityData = await apiService.getCommunityReports();
          if (communityData.success && communityData.reports) {
            setCommunityReports(
              communityData.reports.map((r: Record<string, unknown>) =>
                transformBackendReport({
                  ...r,
                  _id: r.id,
                  description: r.title,
                  photos: r.photoUrl ? [{ url: r.photoUrl }] : [],
                })
              )
            );
          }
        } catch {
          setCommunityReports([]);
        }
      }
    } catch (error) {
      console.error("Error loading reports:", error);
      setReports([]);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      try {
        if (apiService.isAuthenticated()) {
          const userData = apiService.getCurrentUser();
          if (userData) {
            const u: User = {
              id: userData._id || userData.id,
              name: userData.name,
              role: userData.role === "staff" || userData.role === "admin" ? "staff" : "citizen",
            };
            setUser(u);
            await loadReports(u);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) loadReports(user);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, loadReports]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentPage(userData.role === "citizen" ? "dashboard" : "admin");
    toast({
      title: userData.role === "citizen" ? "Welcome!" : "Welcome back!",
      description: `Signed in as ${userData.name}`,
    });
    void loadReports(userData);
  };

  const handleNavigate = async (page: string) => {
    if (page === "home") {
      apiService.logout();
      setUser(null);
      setReports([]);
      setCommunityReports([]);
      setCurrentPage("home");
    } else if ((page === "report" || page === "dashboard" || page === "profile") && !user) {
      setCurrentPage("login");
    } else if ((page === "login" || page === "register") && !user) {
      setCurrentPage(page);
    } else if (page === "admin" && user?.role !== "staff") {
      setCurrentPage("login");
    } else {
      if ((page === "dashboard" || page === "admin") && user) await loadReports(user);
      setCurrentPage(page);
    }
  };

  const handleReportSubmitted = async () => {
    await loadReports(user || undefined);
    setCurrentPage("dashboard");
  };

  const handleUpdateReport = async (reportId: string, updates: StaffReportUpdate) => {
    try {
      if (updates.assignSelf) {
        await apiService.assignReport(reportId);
      } else if (updates.assignStaffId) {
        await apiService.assignReport(reportId, updates.assignStaffId);
      }

      if (updates.priority !== undefined) {
        await apiService.updateReportPriority(reportId, {
          priority: updates.priority,
          note: updates.statusNote,
        });
      }

      if (updates.status) {
        await apiService.updateReportStatus(reportId, {
          status: updates.status,
          resolutionDetails: updates.resolutionDetails,
          estimatedResolutionDate: updates.estimatedResolutionDate,
          rejectionReason: updates.rejectionReason,
          statusNote: updates.statusNote,
        });
      }

      if (updates.staffComment?.trim()) {
        await apiService.addStaffComment(reportId, updates.staffComment.trim());
      }

      await loadReports(user || undefined);
      toast({ title: "Report Updated", description: "Changes saved and citizen notified." });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const token = apiService.getAuthToken() || undefined;

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
      case "register":
        return <Register onLogin={handleLogin} onNavigate={handleNavigate} />;
      case "report":
        return user ? <ReportIssue userId={user.id} onReportSubmitted={handleReportSubmitted} /> : null;
      case "dashboard":
        return user?.role === "citizen" ? (
          <CitizenDashboard
            reports={reports}
            communityReports={communityReports}
            userId={user.id}
            onNavigate={handleNavigate}
            onRefresh={() => loadReports(user)}
          />
        ) : null;
      case "admin":
        return user?.role === "staff" ? (
          <AdminDashboard
            reports={reports}
            onUpdateReport={handleUpdateReport}
            token={token}
            onRefresh={() => loadReports(user)}
          />
        ) : null;
      case "about":
        return <AboutUs />;
      case "analytics":
        return <PublicAnalytics />;
      case "help":
        return <HelpFAQ />;
      case "profile":
        return user ? <ProfileSettings user={user} /> : null;
      default:
        return <Hero onNavigate={handleNavigate} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading Civiconnect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={user?.role || null} onNavigate={handleNavigate} currentPage={currentPage} />
      <main className="pb-8">{renderPage()}</main>
      <Toaster />
    </div>
  );
};

export default Index;

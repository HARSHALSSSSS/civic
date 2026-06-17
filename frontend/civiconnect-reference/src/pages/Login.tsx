import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, User, Shield, AlertCircle } from "lucide-react";
import { apiService } from "@/services/apiService";
import { useBackendWarmup } from "@/hooks/useBackendWarmup";
import { ServerStatusBanner } from "@/components/ServerStatusBanner";
import { warmupBackend } from "@/lib/apiFetch";

interface LoginProps {
  onLogin: (user: { id: string; name: string; role: "citizen" | "staff" }) => void;
  onNavigate?: (page: string) => void;
}

export const Login = ({ onLogin, onNavigate }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Signing in…");
  const [error, setError] = useState<string>("");
  const { status, retryWarmup } = useBackendWarmup();

  const completeLogin = (response: Record<string, unknown>) => {
    const user = response.user as Record<string, unknown> | undefined;
    if (response.success && user) {
      onLogin({
        id: String(user._id || user.id),
        name: String(user.name),
        role: user.role === "staff" || user.role === "admin" ? "staff" : "citizen",
      });
      return true;
    }
    return false;
  };

  const handleLogin = async (_role: "citizen" | "staff") => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setLoadingLabel("Signing in…");
    setError("");

    try {
      await warmupBackend(true);
      const response = await apiService.login(email.trim(), password);

      if (!completeLogin(response as Record<string, unknown>)) {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (role: "citizen" | "staff") => {
    setIsLoading(true);
    setLoadingLabel(role === "citizen" ? "Loading demo citizen…" : "Loading government portal…");
    setError("");

    const credentials =
      role === "citizen"
        ? { email: "test@example.com", password: "password123" }
        : { email: "admin@civiconnect.gov.in", password: "Admin@123" };

    try {
      await warmupBackend(true);

      try {
        const response = await apiService.login(credentials.email, credentials.password);
        if (completeLogin(response as Record<string, unknown>)) return;
      } catch (loginErr) {
        if (role !== "citizen") throw loginErr;
      }

      if (role === "citizen") {
        setLoadingLabel("Creating demo account…");
        const registered = await apiService.register({
          name: "Demo Citizen",
          email: credentials.email,
          password: credentials.password,
          role: "citizen",
        });
        if (!completeLogin(registered as Record<string, unknown>)) {
          setError("Quick login failed.");
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Quick login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-hero rounded-xl flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">Civiconnect</span>
          </div>
          <p className="text-muted-foreground">Sign in to report civic issues</p>
        </div>

        <Tabs defaultValue="citizen" className="space-y-6">
          <ServerStatusBanner
            status={status}
            loading={isLoading}
            loadingLabel={loadingLabel}
            onRetry={retryWarmup}
          />

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="citizen" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Citizen
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Government Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citizen">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Citizen Login
                </CardTitle>
                <CardDescription>
                  Access your civic reporting dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="citizen-email">Email</Label>
                  <Input
                    id="citizen-email"
                    type="email"
                    placeholder="test@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="citizen-password">Password</Label>
                  <Input
                    id="citizen-password"
                    type="password"
                    placeholder="password123"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  variant="civic"
                  onClick={() => handleLogin("citizen")}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In as Citizen"}
                </Button>
                
                {/* Quick Demo Login */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2 text-center">Demo Access:</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => quickLogin("citizen")}
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Quick Demo Login"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-secondary" />
                  Government Staff Login
                </CardTitle>
                <CardDescription>
                  Access the administrative dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Official Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="staff@gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-password">Password</Label>
                  <Input
                    id="staff-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full" 
                  variant="secondary"
                  onClick={() => handleLogin("staff")}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In as Staff"}
                </Button>

                {/* Quick Demo Login */}
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2 text-center">Demo Access:</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => quickLogin("staff")}
                  >
                    Quick Demo as Rajesh Kumar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-primary hover:underline font-medium"
              onClick={() => onNavigate?.("register")}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

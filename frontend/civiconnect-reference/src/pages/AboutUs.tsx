import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Heart, Users, Globe, Sparkles } from "lucide-react";

export const AboutUs = () => {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">About Civiconnect</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Empowering citizens to build better communities through collaborative civic engagement
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              To create a seamless bridge between citizens and local government, enabling every community member 
              to actively participate in improving their neighborhood. We believe that when people can easily 
              report and track civic issues, communities become safer, cleaner, and more connected.
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Heart className="h-4 w-4" />
              <span>Making civic reporting accessible to all</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-secondary" />
              </div>
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              A future where every voice matters in shaping our cities. We envision communities where 
              issues are identified, addressed, and resolved through transparent collaboration between 
              residents and government authorities.
            </p>
            <div className="flex items-center gap-2 text-sm text-secondary font-medium">
              <Globe className="h-4 w-4" />
              <span>Transparent, accountable governance</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-subtle">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            What Makes Us Different
          </CardTitle>
          <CardDescription>
            Key features that empower our community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Community Driven</h3>
              <p className="text-sm text-muted-foreground">
                Every citizen report contributes to a collective effort in improving public services and infrastructure.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-3">
                <Globe className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">Real-time Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Monitor the status of reported issues from submission to resolution with complete transparency.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-3">
                <Sparkles className="h-6 w-6 text-success" />
              </div>
              <h3 className="font-semibold text-foreground">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">
                Smart categorization and priority assessment helps authorities respond faster to critical issues.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Our Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-sm text-muted-foreground">Reports Submitted</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-secondary">85%</div>
              <div className="text-sm text-muted-foreground">Resolution Rate</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-success">5,000+</div>
              <div className="text-sm text-muted-foreground">Active Citizens</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl font-bold text-warning">50+</div>
              <div className="text-sm text-muted-foreground">Cities Served</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

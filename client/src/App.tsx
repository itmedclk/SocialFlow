import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Settings from "@/pages/settings";
import Pipeline from "@/pages/pipeline";
import Review from "@/pages/review";
import AuditLog from "@/pages/audit-log";
import Campaigns from "@/pages/campaigns";
import CampaignEditor from "@/pages/campaign-editor";
import CampaignDetails from "@/pages/campaign-details";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center space-y-6 max-w-md mx-auto p-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-800">SocialFlow</h1>
          <p className="text-slate-600">
            RSS-to-social-media automation platform
          </p>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Sign in with your Replit account to manage your campaigns, review posts, and publish to social media.
          </p>
          <Button 
            asChild
            className="bg-teal-600 hover:bg-teal-700"
            data-testid="button-login"
          >
            <a href="/api/login">Sign in with Replit</a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/campaigns/:id" component={CampaignEditor} />
      <Route path="/campaigns/:id/details" component={CampaignDetails} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/review" component={Review} />
      <Route path="/logs" component={AuditLog} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

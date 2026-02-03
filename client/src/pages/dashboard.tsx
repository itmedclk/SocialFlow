import { Layout } from "@/components/layout";
import { PipelineVisualizer } from "@/components/pipeline-visualizer";
import { LogViewer } from "@/components/log-viewer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowUpRight, 
  CalendarDays, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  Instagram,
  RefreshCw,
  Clock,
  Layers,
  FileText
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalPosts: number;
  drafts: number;
  scheduled: number;
  posted: number;
  failed: number;
  pendingReview: number;
  recentActivity: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerRun = async () => {
    setFetching(true);
    try {
      const response = await fetch('/api/fetch-all', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Failed to trigger fetch');
      
      toast({
        title: "RSS Fetch Started",
        description: "Fetching new content from all active campaigns...",
      });
      
      setTimeout(fetchStats, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger RSS fetch",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  };

  const successRate = stats && stats.totalPosts > 0 
    ? Math.round(((stats.posted) / stats.totalPosts) * 100) 
    : 0;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitoring your active automation campaigns and system performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/logs">
            <Button variant="outline" className="gap-2" data-testid="button-view-logs">
              <FileCheck className="h-4 w-4" />
              View Audit Log
            </Button>
          </Link>
          <Button 
            className="gap-2 shadow-lg shadow-primary/25" 
            onClick={handleTriggerRun}
            disabled={fetching}
            data-testid="button-trigger-run"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? 'Fetching...' : 'Trigger Run Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <Layers className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-campaigns">
              {loading ? "..." : stats?.activeCampaigns || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats?.totalCampaigns || 0} total campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-emerald-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600" data-testid="stat-success-rate">
              {loading ? "..." : `${successRate}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.posted || 0} posts published
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600" data-testid="stat-total-posts">
              {loading ? "..." : stats?.totalPosts || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.drafts || 0} pending review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-amber-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Posts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-failed">
              {loading ? "..." : stats?.failed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.scheduled || 0} scheduled
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-lg">
        <CardHeader>
          <CardTitle>Live Execution Status</CardTitle>
          <CardDescription>Visualizing current workflow steps and node status</CardDescription>
        </CardHeader>
        <CardContent className="px-0 md:px-6">
          <PipelineVisualizer />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">System Logs</h3>
            <Link href="/logs">
              <Badge variant="outline" className="font-mono text-xs cursor-pointer hover:bg-muted">
                View All
              </Badge>
            </Link>
          </div>
          <LogViewer />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Quick Actions</h3>
          <Card className="overflow-hidden border-border/60 shadow-md">
            <CardContent className="p-4 space-y-3">
              <Link href="/campaigns/new">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Layers className="h-4 w-4" />
                  Create New Campaign
                </Button>
              </Link>
              <Link href="/review">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4" />
                  Review Pending Posts ({stats?.pendingReview || 0})
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Manage Campaigns
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

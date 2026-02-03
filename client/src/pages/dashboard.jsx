var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { Layout } from "@/components/layout";
import { PipelineVisualizer } from "@/components/pipeline-visualizer";
import { LogViewer } from "@/components/log-viewer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, CheckCircle2, AlertTriangle, FileCheck, RefreshCw, Layers, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
export default function Dashboard() {
    var _this = this;
    var _a = useState(null), stats = _a[0], setStats = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), fetching = _c[0], setFetching = _c[1];
    var toast = useToast().toast;
    useEffect(function () {
        fetchStats();
    }, []);
    var fetchStats = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/stats', { credentials: 'include' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch stats');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setStats(data);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching stats:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleTriggerRun = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setFetching(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/fetch-all', { method: 'POST', credentials: 'include' })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to trigger fetch');
                    toast({
                        title: "RSS Fetch Started",
                        description: "Fetching new content from all active campaigns...",
                    });
                    setTimeout(fetchStats, 2000);
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to trigger RSS fetch",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setFetching(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var successRate = stats && stats.totalPosts > 0
        ? Math.round(((stats.posted) / stats.totalPosts) * 100)
        : 0;
    return (<Layout>
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
              <FileCheck className="h-4 w-4"/>
              View Audit Log
            </Button>
          </Link>
          <Button className="gap-2 shadow-lg shadow-primary/25" onClick={handleTriggerRun} disabled={fetching} data-testid="button-trigger-run">
            <RefreshCw className={"h-4 w-4 ".concat(fetching ? 'animate-spin' : '')}/>
            {fetching ? 'Fetching...' : 'Trigger Run Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            <Layers className="h-4 w-4 text-primary"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-active-campaigns">
              {loading ? "..." : (stats === null || stats === void 0 ? void 0 : stats.activeCampaigns) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {(stats === null || stats === void 0 ? void 0 : stats.totalCampaigns) || 0} total campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-emerald-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600" data-testid="stat-success-rate">
              {loading ? "..." : "".concat(successRate, "%")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats === null || stats === void 0 ? void 0 : stats.posted) || 0} posts published
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-indigo-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-indigo-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600" data-testid="stat-total-posts">
              {loading ? "..." : (stats === null || stats === void 0 ? void 0 : stats.totalPosts) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats === null || stats === void 0 ? void 0 : stats.drafts) || 0} pending review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur shadow-sm hover:shadow-md transition-all border-amber-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed Posts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500"/>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-failed">
              {loading ? "..." : (stats === null || stats === void 0 ? void 0 : stats.failed) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(stats === null || stats === void 0 ? void 0 : stats.scheduled) || 0} scheduled
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
                  <Layers className="h-4 w-4"/>
                  Create New Campaign
                </Button>
              </Link>
              <Link href="/review">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <FileText className="h-4 w-4"/>
                  Review Pending Posts ({(stats === null || stats === void 0 ? void 0 : stats.pendingReview) || 0})
                </Button>
              </Link>
              <Link href="/campaigns">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <CalendarDays className="h-4 w-4"/>
                  Manage Campaigns
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>);
}

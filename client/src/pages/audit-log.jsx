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
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, RefreshCw, Filter, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
function formatMetadata(metadata) {
    if (!metadata)
        return "";
    try {
        return JSON.stringify(metadata);
    }
    catch (_a) {
        return String(metadata);
    }
}
export default function AuditLog() {
    var _this = this;
    var _a = useState([]), campaigns = _a[0], setCampaigns = _a[1];
    var _b = useState([]), logs = _b[0], setLogs = _b[1];
    var _c = useState("all"), selectedCampaignId = _c[0], setSelectedCampaignId = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState(""), searchTerm = _e[0], setSearchTerm = _e[1];
    useEffect(function () {
        fetchCampaigns();
        fetchLogs();
    }, []);
    useEffect(function () {
        fetchLogs();
    }, [selectedCampaignId]);
    var fetchCampaigns = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/campaigns', { credentials: 'include' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch campaigns');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setCampaigns(data);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching campaigns:', error_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var fetchLogs = function () { return __awaiter(_this, void 0, void 0, function () {
        var url, response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    url = selectedCampaignId !== "all"
                        ? "/api/logs?campaignId=".concat(selectedCampaignId, "&limit=100")
                        : '/api/logs?limit=100';
                    return [4 /*yield*/, fetch(url, { credentials: 'include' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch logs');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setLogs(data);
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error fetching logs:', error_2);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var activeCampaign = campaigns.find(function (c) { return c.id.toString() === selectedCampaignId; });
    var filteredLogs = logs.filter(function (log) {
        return searchTerm === "" ||
            log.message.toLowerCase().includes(searchTerm.toLowerCase());
    });
    var formatDateTime = function (date) {
        if (!date)
            return "--";
        return new Date(date).toLocaleString();
    };
    var getLevelIcon = function (level) {
        switch (level) {
            case "error":
                return <AlertCircle className="h-3 w-3"/>;
            case "warning":
                return <AlertCircle className="h-3 w-3"/>;
            default:
                return <Info className="h-3 w-3"/>;
        }
    };
    return (<Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">
              Historical record of all system events and execution attempts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
             <div className="w-[250px]">
               <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                 <SelectTrigger className="h-9" data-testid="select-campaign-filter">
                   <div className="flex items-center gap-2">
                     <Filter className="h-3.5 w-3.5 text-muted-foreground"/>
                     <SelectValue placeholder="Select Campaign Log"/>
                   </div>
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Campaigns</SelectItem>
                   {campaigns.map(function (campaign) { return (<SelectItem key={campaign.id} value={campaign.id.toString()}>
                       {campaign.name}
                     </SelectItem>); })}
                 </SelectContent>
               </Select>
             </div>
            <Button variant="secondary" size="icon" className="h-9 w-9" onClick={fetchLogs} data-testid="button-refresh-logs">
              <RefreshCw className="h-4 w-4"/>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeCampaign ? "Logs: ".concat(activeCampaign.name) : "All System Logs"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {filteredLogs.length} log entries
                </CardDescription>
              </div>
              <div className="relative w-64 hidden sm:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                <Input placeholder="Search logs..." className="pl-8 h-9" value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} data-testid="input-search-logs"/>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (<div className="text-center py-12 text-muted-foreground">
                Loading logs...
              </div>) : (<Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (filteredLogs.map(function (log) { return (<TableRow key={log.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px] flex w-fit gap-1 items-center border-0 px-2 py-0.5", log.level === "info" && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400", log.level === "warning" && "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400", log.level === "error" && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400")}>
                            {getLevelIcon(log.level)}
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{log.message}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {log.campaignId && (<div className="text-[10px] text-muted-foreground font-mono">
                                Campaign ID: {log.campaignId}
                              </div>)}
                            {log.postId && (<Link href={"/review?postId=".concat(log.postId)}>
                                <Button variant="link" className="h-auto p-0 text-[10px] text-primary h-fit">
                                  View Post Details
                                </Button>
                              </Link>)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {!!log.metadata && (<span className="text-muted-foreground text-xs font-mono line-clamp-1 max-w-[300px]">
                              {formatMetadata(log.metadata)}
                            </span>)}
                        </TableCell>
                      </TableRow>); })) : (<TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No logs found.
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>)}
          </CardContent>
        </Card>
      </div>
    </Layout>);
}

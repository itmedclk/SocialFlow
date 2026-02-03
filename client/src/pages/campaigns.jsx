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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Settings2, Clock, Trash2, ExternalLink, Calendar, Globe } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
function formatSchedule(cron) {
    if (!cron)
        return "No schedule set";
    var parts = cron.split(" ");
    if (parts.length !== 5)
        return cron;
    var minute = parts[0], hour = parts[1], dayOfMonth = parts[2], month = parts[3], dayOfWeek = parts[4];
    if (hour.startsWith("*/")) {
        var interval = hour.slice(2);
        return "Every ".concat(interval, " hour").concat(interval === "1" ? "" : "s");
    }
    var time = "".concat(hour.padStart(2, "0"), ":").concat(minute.padStart(2, "0"));
    if (dayOfWeek === "*") {
        return "Daily at ".concat(time);
    }
    var dayMap = {
        "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed",
        "4": "Thu", "5": "Fri", "6": "Sat"
    };
    var days = dayOfWeek.split(",").map(function (d) { return dayMap[d] || d; }).join(", ");
    return "".concat(days, " at ").concat(time);
}
export default function Campaigns() {
    var _this = this;
    var _a = useState([]), campaigns = _a[0], setCampaigns = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    useEffect(function () {
        fetchCampaigns();
    }, []);
    var fetchCampaigns = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/campaigns', { credentials: 'include' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch campaigns');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setCampaigns(data);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching campaigns:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var toggleCampaignStatus = function (campaign) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/campaigns/".concat(campaign.id), {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ isActive: !campaign.isActive })
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to update campaign');
                    return [4 /*yield*/, fetchCampaigns()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('Error toggling campaign status:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var deleteCampaign = function (id) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!confirm('Are you sure you want to delete this campaign?'))
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/campaigns/".concat(id), {
                            method: 'DELETE',
                            credentials: 'include'
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to delete campaign');
                    return [4 /*yield*/, fetchCampaigns()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    console.error('Error deleting campaign:', error_3);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automation Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Manage different content topics, schedules, and configurations.
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button className="gap-2 shadow-lg shadow-primary/25" data-testid="button-create-campaign">
              <Plus className="h-4 w-4"/>
              Create New Campaign
            </Button>
          </Link>
        </div>

        {loading ? (<div className="text-center py-12 text-muted-foreground">
            Loading campaigns...
          </div>) : (<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map(function (campaign) {
                var _a;
                return (<Card key={campaign.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md" data-testid={"card-campaign-".concat(campaign.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg" data-testid={"text-campaign-name-".concat(campaign.id)}>{campaign.name}</CardTitle>
                      <Badge variant="secondary" className="font-normal text-xs">
                        {campaign.topic}
                      </Badge>
                    </div>
                    <Badge variant="outline" className={campaign.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"} data-testid={"status-campaign-".concat(campaign.id)}>
                      {campaign.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary/70"/>
                      <span>{formatSchedule(campaign.scheduleCron)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary/70"/>
                      <span>{((_a = campaign.rssUrls) === null || _a === void 0 ? void 0 : _a.length) || 0} RSS Sources Configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary/70"/>
                      <span className="text-xs">Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t bg-muted/5 flex justify-between gap-2">
                  <div className="flex gap-2">
                    <Link href={"/campaigns/".concat(campaign.id, "/details")}>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5"/>
                        Posts
                      </Button>
                    </Link>
                    <Link href={"/campaigns/".concat(campaign.id)}>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5" data-testid={"button-configure-".concat(campaign.id)}>
                        <Settings2 className="h-3.5 w-3.5"/>
                        Configure
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={function () { return deleteCampaign(campaign.id); }} data-testid={"button-delete-".concat(campaign.id)}>
                      <Trash2 className="h-3.5 w-3.5"/>
                    </Button>
                  </div>
                  <Button variant="secondary" size="sm" className={campaign.isActive
                        ? "h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        : "h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"} onClick={function () { return toggleCampaignStatus(campaign); }} data-testid={"button-toggle-status-".concat(campaign.id)}>
                    {campaign.isActive ? <Pause className="h-3.5 w-3.5"/> : <Play className="h-3.5 w-3.5"/>}
                  </Button>
                </CardFooter>
              </Card>);
            })}
            
            {/* Add New Placeholder Card */}
            <Link href="/campaigns/new">
              <Card className="h-full border-dashed border-2 flex flex-col items-center justify-center p-6 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer min-h-[200px]" data-testid="card-add-campaign">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6"/>
                </div>
                <h3 className="font-semibold text-lg mb-1">Add New Campaign</h3>
                <p className="text-sm text-center max-w-[200px]">
                  Configure a new topic, schedule, and automation rules.
                </p>
              </Card>
            </Link>
          </div>)}
      </div>
    </Layout>);
}

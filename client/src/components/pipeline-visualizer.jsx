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
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
function getStepsFromPosts(posts) {
    var drafts = posts.filter(function (p) { return p.status === "draft"; });
    var approved = posts.filter(function (p) { return p.status === "approved"; });
    var scheduled = posts.filter(function (p) { return p.status === "scheduled"; });
    var posted = posts.filter(function (p) { return p.status === "posted"; });
    var failed = posts.filter(function (p) { return p.status === "failed"; });
    var hasContent = posts.length > 0;
    var hasDrafts = drafts.length > 0;
    var hasApproved = approved.length > 0;
    var hasScheduled = scheduled.length > 0;
    var hasPosted = posted.length > 0;
    var hasFailed = failed.length > 0;
    return [
        {
            label: "RSS Feed",
            status: hasContent ? "completed" : "pending",
            description: hasContent ? "".concat(posts.length, " articles") : "Waiting...",
            index: 0
        },
        {
            label: "Dedupe Filter",
            status: hasContent ? "completed" : "pending",
            description: hasContent ? "Filtered" : "Check History",
            index: 1
        },
        {
            label: "AI Generation",
            status: drafts.some(function (p) { return p.generatedCaption; }) ? "completed" : (hasDrafts ? "active" : "pending"),
            description: drafts.filter(function (p) { return p.generatedCaption; }).length > 0
                ? "".concat(drafts.filter(function (p) { return p.generatedCaption; }).length, " captions")
                : (hasDrafts ? "".concat(drafts.length, " pending") : "Caption & Tags"),
            index: 2
        },
        {
            label: "Safety Check",
            status: hasApproved || hasScheduled || hasPosted ? "completed" : "pending",
            description: hasApproved || hasScheduled || hasPosted ? "Passed" : "Validation",
            index: 3
        },
        {
            label: "Review Queue",
            status: hasDrafts ? "active" : (hasApproved || hasScheduled ? "completed" : "pending"),
            description: hasDrafts ? "".concat(drafts.length, " pending") : "Approved",
            index: 4
        },
        {
            label: "Scheduled",
            status: hasScheduled ? "active" : (hasPosted ? "completed" : "pending"),
            description: hasScheduled ? "".concat(scheduled.length, " queued") : (hasPosted ? "Published" : "Schedule"),
            index: 5
        },
        {
            label: "Published",
            status: hasFailed ? "error" : (hasPosted ? "completed" : "pending"),
            description: hasFailed ? "".concat(failed.length, " failed") : (hasPosted ? "".concat(posted.length, " posted") : "Postly API"),
            index: 6
        },
    ];
}
export function PipelineVisualizer(_a) {
    var _this = this;
    var isRunning = _a.isRunning, onComplete = _a.onComplete;
    var _b = useState([]), campaigns = _b[0], setCampaigns = _b[1];
    var _c = useState("all"), selectedCampaign = _c[0], setSelectedCampaign = _c[1];
    var _d = useState([]), posts = _d[0], setPosts = _d[1];
    var _e = useState([]), steps = _e[0], setSteps = _e[1];
    var _f = useState(true), loading = _f[0], setLoading = _f[1];
    useEffect(function () {
        if (!isRunning)
            return;
        var timeout = setTimeout(function () {
            onComplete === null || onComplete === void 0 ? void 0 : onComplete();
        }, 3000);
        return function () { return clearTimeout(timeout); };
    }, [isRunning, onComplete]);
    useEffect(function () {
        fetchCampaigns();
    }, []);
    useEffect(function () {
        fetchPosts();
    }, [selectedCampaign]);
    var fetchCampaigns = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch('/api/campaigns')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setCampaigns(data);
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error fetching campaigns:', error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var fetchPosts = function () { return __awaiter(_this, void 0, void 0, function () {
        var url, response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    setLoading(true);
                    url = selectedCampaign !== "all"
                        ? "/api/posts?campaignId=".concat(selectedCampaign)
                        : '/api/posts';
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setPosts(data);
                    setSteps(getStepsFromPosts(data));
                    _a.label = 3;
                case 3: return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    console.error('Error fetching posts:', error_2);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="space-y-4">
      <div className="flex items-center justify-between px-6 md:px-0">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[250px]" data-testid="select-pipeline-campaign">
            <SelectValue placeholder="Select Campaign"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            {campaigns.map(function (campaign) { return (<SelectItem key={campaign.id} value={campaign.id.toString()}>
                {campaign.name}
              </SelectItem>); })}
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          {posts.length} posts in pipeline
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-6 -mx-6 px-6 md:mx-0 md:px-0">
        <div className="min-w-max flex items-center gap-4">
          {steps.map(function (step, i) { return (<div key={i} className="flex items-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={cn("relative group flex flex-col items-center justify-center w-36 h-28 rounded-2xl border-2 transition-all duration-300", step.status === "active" && "bg-primary/5 border-primary shadow-[0_0_20px_-5px_var(--color-primary)] scale-105", step.status === "completed" && "bg-card border-primary/20", step.status === "pending" && "bg-muted/30 border-muted-foreground/10 opacity-60", step.status === "error" && "bg-destructive/5 border-destructive shadow-[0_0_20px_-5px_var(--color-destructive)]")}>
                {step.status === "active" && (<span className="absolute -top-3 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full tracking-wider uppercase shadow-md">
                    Active
                  </span>)}
                
                <div className="mb-2">
                  {step.status === "completed" && <CheckCircle2 className="h-6 w-6 text-primary"/>}
                  {step.status === "active" && <Clock className="h-6 w-6 text-primary animate-pulse"/>}
                  {step.status === "pending" && <Circle className="h-6 w-6 text-muted-foreground"/>}
                  {step.status === "error" && <XCircle className="h-6 w-6 text-destructive"/>}
                </div>

                <div className="text-center">
                  <p className={cn("font-bold text-xs", step.status === "active" ? "text-primary" : "text-foreground")}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{step.description}</p>
                </div>
              </motion.div>
              
              {i < steps.length - 1 && (<div className="w-6 flex justify-center">
                  <ArrowRight className={cn("h-4 w-4", step.status === "completed" ? "text-primary/50" : "text-muted-foreground/20")}/>
                </div>)}
            </div>); })}
        </div>
      </div>
    </div>);
}

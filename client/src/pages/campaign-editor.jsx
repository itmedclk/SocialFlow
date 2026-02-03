var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Globe, Key, ShieldAlert, Clock, Plus, Trash2, ArrowLeft, Layers, Image as ImageIcon, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useParams } from "wouter";
function cronToSchedule(cron) {
    if (!cron)
        return { frequency: "daily", time: "09:00", days: [] };
    var parts = cron.split(" ");
    if (parts.length !== 5)
        return { frequency: "custom", time: "09:00", days: [] };
    var minute = parts[0], hour = parts[1], dayOfMonth = parts[2], month = parts[3], dayOfWeek = parts[4];
    if (hour.startsWith("*/")) {
        return { frequency: "hourly", time: "".concat(hour.slice(2).padStart(2, "0"), ":00"), days: [] };
    }
    var timeStr = "".concat(hour.padStart(2, "0"), ":").concat(minute.padStart(2, "0"));
    if (dayOfWeek === "*") {
        return { frequency: "daily", time: timeStr, days: [] };
    }
    var dayMap = { "0": "sun", "1": "mon", "2": "tue", "3": "wed", "4": "thu", "5": "fri", "6": "sat" };
    var days = dayOfWeek.split(",").map(function (d) { return dayMap[d] || d; });
    return { frequency: "weekly", time: timeStr, days: days };
}
function scheduleToCron(frequency, time, days) {
    var _a = time.split(":").map(Number), hour = _a[0], minute = _a[1];
    switch (frequency) {
        case "hourly":
            return "0 */".concat(hour || 1, " * * *");
        case "daily":
            return "".concat(minute, " ").concat(hour, " * * *");
        case "weekly":
            var dayMap_1 = { "sun": "0", "mon": "1", "tue": "2", "wed": "3", "thu": "4", "fri": "5", "sat": "6" };
            var dayNums = days.map(function (d) { return dayMap_1[d]; }).join(",") || "*";
            return "".concat(minute, " ").concat(hour, " * * ").concat(dayNums);
        default:
            return "";
    }
}
export default function CampaignEditor() {
    var _this = this;
    var _a, _b;
    var _c = useLocation(), location = _c[0], setLocation = _c[1];
    var params = useParams();
    var campaignId = !params.id || params.id === 'new' ? null : parseInt(params.id);
    var _d = useState(!!campaignId), loading = _d[0], setLoading = _d[1];
    var _e = useState(""), name = _e[0], setName = _e[1];
    var _f = useState(""), topic = _f[0], setTopic = _f[1];
    var _g = useState("daily"), scheduleFrequency = _g[0], setScheduleFrequency = _g[1];
    var _h = useState("09:00"), scheduleTime = _h[0], setScheduleTime = _h[1];
    var _j = useState([]), scheduleDays = _j[0], setScheduleDays = _j[1];
    var _k = useState("America/Los_Angeles"), scheduleTimezone = _k[0], setScheduleTimezone = _k[1];
    var _l = useState([""]), rssUrls = _l[0], setRssUrls = _l[1];
    var _m = useState([]), imageKeywords = _m[0], setImageKeywords = _m[1];
    var _o = useState([
        { type: "unsplash", value: "" }
    ]), imageSources = _o[0], setImageSources = _o[1];
    var _p = useState([]), selectedPlatforms = _p[0], setSelectedPlatforms = _p[1];
    var _q = useState(false), useSpecificAccount = _q[0], setUseSpecificAccount = _q[1];
    var _r = useState(""), specificAccountId = _r[0], setSpecificAccountId = _r[1];
    var _s = useState(""), aiPrompt = _s[0], setAiPrompt = _s[1];
    var _t = useState(""), safetyForbiddenTerms = _t[0], setSafetyForbiddenTerms = _t[1];
    var _u = useState(2000), safetyMaxLength = _u[0], setSafetyMaxLength = _u[1];
    var _v = useState(true), isActive = _v[0], setIsActive = _v[1];
    var _w = useState(false), autoPublish = _w[0], setAutoPublish = _w[1];
    var _x = useState(false), useAiImage = _x[0], setUseAiImage = _x[1];
    var toast = useToast().toast;
    useEffect(function () {
        if (campaignId) {
            fetchCampaign();
        }
    }, [campaignId]);
    var fetchCampaign = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, campaign, schedule, error_1;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, fetch("/api/campaigns/".concat(campaignId))];
                case 1:
                    response = _e.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch campaign');
                    return [4 /*yield*/, response.json()];
                case 2:
                    campaign = _e.sent();
                    setName(campaign.name);
                    setTopic(campaign.topic);
                    schedule = cronToSchedule(campaign.scheduleCron || "");
                    setScheduleFrequency(schedule.frequency);
                    setScheduleTime(schedule.time);
                    setScheduleDays(schedule.days);
                    setRssUrls(campaign.rssUrls && campaign.rssUrls.length > 0 ? campaign.rssUrls : [""]);
                    setImageKeywords(campaign.imageKeywords || []);
                    setImageSources(campaign.imageProviders && campaign.imageProviders.length > 0
                        ? campaign.imageProviders
                        : [{ type: "unsplash", value: "" }]);
                    setSelectedPlatforms(campaign.targetPlatforms || []);
                    setUseSpecificAccount((_a = campaign.useSpecificAccount) !== null && _a !== void 0 ? _a : false);
                    setSpecificAccountId(campaign.specificAccountId || "");
                    setScheduleTimezone(campaign.scheduleTimezone || "America/Los_Angeles");
                    setAiPrompt(campaign.aiPrompt || "");
                    setSafetyForbiddenTerms(campaign.safetyForbiddenTerms || "");
                    setSafetyMaxLength(campaign.safetyMaxLength || 2000);
                    setIsActive((_b = campaign.isActive) !== null && _b !== void 0 ? _b : true);
                    setAutoPublish((_c = campaign.autoPublish) !== null && _c !== void 0 ? _c : false);
                    setUseAiImage((_d = campaign.useAiImage) !== null && _d !== void 0 ? _d : false);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _e.sent();
                    console.error('Error fetching campaign:', error_1);
                    toast({
                        title: "Error",
                        description: "Failed to load campaign",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var addRssUrl = function () {
        setRssUrls(__spreadArray(__spreadArray([], rssUrls, true), [""], false));
    };
    var removeRssUrl = function (index) {
        var newUrls = __spreadArray([], rssUrls, true);
        newUrls.splice(index, 1);
        setRssUrls(newUrls.length > 0 ? newUrls : [""]);
    };
    var updateRssUrl = function (index, value) {
        var newUrls = __spreadArray([], rssUrls, true);
        newUrls[index] = value;
        setRssUrls(newUrls);
    };
    var addImageSource = function () {
        setImageSources(__spreadArray(__spreadArray([], imageSources, true), [{ type: "unsplash", value: "" }], false));
    };
    var removeImageSource = function (index) {
        var newSources = __spreadArray([], imageSources, true);
        newSources.splice(index, 1);
        setImageSources(newSources.length > 0 ? newSources : [{ type: "unsplash", value: "" }]);
    };
    var updateImageSource = function (index, field, value) {
        var _a;
        var newSources = __spreadArray([], imageSources, true);
        newSources[index] = __assign(__assign({}, newSources[index]), (_a = {}, _a[field] = value, _a));
        setImageSources(newSources);
    };
    var togglePlatform = function (platform) {
        setSelectedPlatforms(function (prev) {
            return prev.includes(platform)
                ? prev.filter(function (p) { return p !== platform; })
                : __spreadArray(__spreadArray([], prev, true), [platform], false);
        });
    };
    var handleSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var validRssUrls, validImageSources, cronExpression, campaignData, url, method, response, error, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!name.trim() || !topic.trim()) {
                        toast({
                            title: "Validation Error",
                            description: "Please fill in campaign name and topic",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    validRssUrls = rssUrls.filter(function (url) { return url.trim() !== ""; });
                    validImageSources = imageSources.filter(function (source) { return source.value.trim() !== ""; });
                    cronExpression = scheduleToCron(scheduleFrequency, scheduleTime, scheduleDays);
                    campaignData = {
                        name: name.trim(),
                        topic: topic.trim(),
                        scheduleCron: cronExpression || null,
                        scheduleTimezone: scheduleTimezone,
                        rssUrls: validRssUrls,
                        imageKeywords: imageKeywords,
                        imageProviders: validImageSources,
                        targetPlatforms: selectedPlatforms,
                        useSpecificAccount: useSpecificAccount,
                        specificAccountId: useSpecificAccount ? specificAccountId.trim() || null : null,
                        aiPrompt: aiPrompt.trim() || null,
                        safetyForbiddenTerms: safetyForbiddenTerms.trim() || null,
                        safetyMaxLength: safetyMaxLength,
                        isActive: isActive,
                        autoPublish: autoPublish,
                        useAiImage: useAiImage,
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    url = campaignId ? "/api/campaigns/".concat(campaignId) : '/api/campaigns';
                    method = campaignId ? 'PATCH' : 'POST';
                    return [4 /*yield*/, fetch(url, {
                            method: method,
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(campaignData)
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    error = _a.sent();
                    throw new Error(error.error || 'Failed to save campaign');
                case 4:
                    toast({
                        title: "Success",
                        description: campaignId ? "Campaign updated successfully" : "Campaign created successfully",
                        variant: "default",
                    });
                    setLocation("/campaigns");
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _a.sent();
                    console.error('Error saving campaign:', error_2);
                    toast({
                        title: "Error",
                        description: error_2 instanceof Error ? error_2.message : "Failed to save campaign",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    if (loading) {
        return (<Layout>
        <div className="text-center py-12 text-muted-foreground">
          Loading campaign...
        </div>
      </Layout>);
    }
    return (<Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5"/>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaignId ? "Edit Campaign" : "Create New Campaign"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {campaignId ? "Configure \"".concat(name, "\"") : "Set up a new automation campaign"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Config Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary"/>
                  <CardTitle>Campaign Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Campaign Name *</Label>
                    <Input value={name} onChange={function (e) { return setName(e.target.value); }} placeholder="e.g., Tech Startup News" data-testid="input-campaign-name"/>
                  </div>
                  <div className="space-y-2">
                    <Label>Topic / Category *</Label>
                    <Input value={topic} onChange={function (e) { return setTopic(e.target.value); }} placeholder="e.g., Technology" data-testid="input-campaign-topic"/>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Automation Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary"/>
                  <CardTitle>Schedule</CardTitle>
                </div>
                <CardDescription>When should this campaign run automatically?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={scheduleFrequency} onChange={function (e) {
            var newFrequency = e.target.value;
            setScheduleFrequency(newFrequency);
            // Reset time to appropriate default when switching frequencies
            if (newFrequency === "hourly") {
                setScheduleTime("01:00"); // Default to every 1 hour
            }
            else if (scheduleTime.split(":")[0] === "01" || scheduleTime.split(":")[0] === "02" || scheduleTime.split(":")[0] === "03" || scheduleTime.split(":")[0] === "04" || scheduleTime.split(":")[0] === "06" || scheduleTime.split(":")[0] === "08" || scheduleTime.split(":")[0] === "12") {
                // If coming from hourly with small hours, reset to 9 AM
                setScheduleTime("09:00");
            }
        }} data-testid="select-frequency">
                      <option value="hourly">Every X Hours</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Specific Days</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{scheduleFrequency === "hourly" ? "Every X Hours" : "Run Time"}</Label>
                    {scheduleFrequency === "hourly" ? (<select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={scheduleTime.split(":")[0]} onChange={function (e) { return setScheduleTime("".concat(e.target.value, ":00")); }} data-testid="select-hours-interval">
                        <option value="01">Every 1 hour</option>
                        <option value="02">Every 2 hours</option>
                        <option value="03">Every 3 hours</option>
                        <option value="04">Every 4 hours</option>
                        <option value="06">Every 6 hours</option>
                        <option value="08">Every 8 hours</option>
                        <option value="12">Every 12 hours</option>
                      </select>) : (<Input type="time" value={scheduleTime} onChange={function (e) { return setScheduleTime(e.target.value); }} data-testid="input-time"/>)}
                  </div>
                </div>
                
                {scheduleFrequency === "weekly" && (<div className="space-y-2">
                    <Label>Run on these days</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                { id: "mon", label: "Mon" },
                { id: "tue", label: "Tue" },
                { id: "wed", label: "Wed" },
                { id: "thu", label: "Thu" },
                { id: "fri", label: "Fri" },
                { id: "sat", label: "Sat" },
                { id: "sun", label: "Sun" },
            ].map(function (day) { return (<button key={day.id} type="button" className={"px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ".concat(scheduleDays.includes(day.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input")} onClick={function () {
                    setScheduleDays(function (prev) {
                        return prev.includes(day.id)
                            ? prev.filter(function (d) { return d !== day.id; })
                            : __spreadArray(__spreadArray([], prev, true), [day.id], false);
                    });
                }} data-testid={"day-".concat(day.id)}>
                          {day.label}
                        </button>); })}
                    </div>
                  </div>)}
                
                <div className="space-y-2 mt-4">
                  <Label>Timezone</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={scheduleTimezone} onChange={function (e) { return setScheduleTimezone(e.target.value); }} data-testid="select-timezone">
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">London (GMT/BST)</option>
                    <option value="Europe/Paris">Paris (CET)</option>
                    <option value="Asia/Tokyo">Tokyo (JST)</option>
                    <option value="Asia/Shanghai">Shanghai (CST)</option>
                    <option value="Australia/Sydney">Sydney (AEST)</option>
                  </select>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  {scheduleFrequency === "hourly" && "Campaign will run at the start of every interval."}
                  {scheduleFrequency === "daily" && "Campaign will run every day at ".concat(scheduleTime, " (").concat((_a = scheduleTimezone.split('/').pop()) === null || _a === void 0 ? void 0 : _a.replace('_', ' '), ").")}
                  {scheduleFrequency === "weekly" && scheduleDays.length > 0 && "Campaign will run on ".concat(scheduleDays.join(", "), " at ").concat(scheduleTime, " (").concat((_b = scheduleTimezone.split('/').pop()) === null || _b === void 0 ? void 0 : _b.replace('_', ' '), ").")}
                  {scheduleFrequency === "weekly" && scheduleDays.length === 0 && "Select at least one day for the campaign to run."}
                </p>
              </CardContent>
            </Card>

            {/* RSS Source */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary"/>
                  <CardTitle>Content Sources</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>RSS Feed URLs</Label>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={addRssUrl} data-testid="button-add-rss">
                      <Plus className="h-3 w-3"/> Add Source
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {rssUrls.map(function (url, index) { return (<div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-xs font-mono text-muted-foreground">#{index + 1}</span>
                          <Input value={url} onChange={function (e) { return updateRssUrl(index, e.target.value); }} className="font-mono text-xs pl-8" placeholder="https://example.com/rss" data-testid={"input-rss-".concat(index)}/>
                        </div>
                        {rssUrls.length > 1 && (<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={function () { return removeRssUrl(index); }} data-testid={"button-remove-rss-".concat(index)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>)}
                      </div>); })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Sources */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary"/>
                  <CardTitle>Image Source Override</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Specific Keyword Overrides</Label>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={addImageSource} data-testid="button-add-image-source">
                      <Plus className="h-3 w-3"/> Add Keyword
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {imageSources.map(function (source, index) { return (<div key={index} className="flex gap-2 items-start">
                        <div className="w-[140px]">
                           <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={source.type} onChange={function (e) { return updateImageSource(index, 'type', e.target.value); }} data-testid={"select-image-provider-".concat(index)}>
                             <option value="unsplash">Unsplash</option>
                             <option value="pexels">Pexels</option>
                             <option value="wikimedia">Wikimedia</option>
                           </select>
                        </div>
                        <div className="relative flex-1">
                          <Input value={source.value} onChange={function (e) { return updateImageSource(index, 'value', e.target.value); }} placeholder="e.g., technology, startup" className="text-sm" data-testid={"input-image-keywords-".concat(index)}/>
                        </div>
                        {imageSources.length > 1 && (<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={function () { return removeImageSource(index); }} data-testid={"button-remove-image-source-".concat(index)}>
                            <Trash2 className="h-4 w-4"/>
                          </Button>)}
                      </div>); })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    System will default to dynamic AI search using global sources. Use these overrides only if specific keywords are required for this topic.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Targeting */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary"/>
                  <CardTitle>Account Targeting</CardTitle>
                </div>
                <CardDescription>
                  Choose where to publish posts from this campaign.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="cursor-pointer">Post to specific account</Label>
                    <p className="text-[11px] text-muted-foreground">
                      {useSpecificAccount
            ? "Posts will go to a specific account ID"
            : "Posts will go to all accounts in the channel"}
                    </p>
                  </div>
                  <Switch checked={useSpecificAccount} onCheckedChange={setUseSpecificAccount} data-testid="switch-use-specific-account"/>
                </div>
                
                {useSpecificAccount && (<div className="space-y-2 pt-2 border-t">
                    <Label>Specific Account ID(s)</Label>
                    <Input value={specificAccountId} onChange={function (e) { return setSpecificAccountId(e.target.value); }} className="font-mono text-sm" placeholder="e.g., 123456789 or 123456789, 987654321" data-testid="input-specific-account-id"/>
                    <p className="text-[10px] text-muted-foreground">
                      Get your account ID from your Postly dashboard. To post to multiple accounts, separate IDs with commas.
                    </p>
                  </div>)}
              </CardContent>
            </Card>

            {/* AI Configuration Override */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary"/>
                  <CardTitle>AI & Generation Settings</CardTitle>
                </div>
                <CardDescription>Custom AI prompt for this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>System Prompt Template</Label>
                  <textarea className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={aiPrompt} onChange={function (e) { return setAiPrompt(e.target.value); }} placeholder="e.g., You are a tech journalist. Summarize this news for a LinkedIn audience..." data-testid="textarea-ai-prompt"/>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Config Column */}
          <div className="space-y-6">
            
            {/* Save Actions */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <Button className="w-full gap-2 shadow-md" size="lg" onClick={handleSave} data-testid="button-save-campaign">
                  <Save className="h-4 w-4"/> Save Campaign
                </Button>
                <div className="flex items-center justify-between px-2">
                  <Label className="cursor-pointer">Active</Label>
                  <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-is-active"/>
                </div>
                <Separator />
                <div className="space-y-2 px-2">
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Automatic</Label>
                    <Switch checked={autoPublish} onCheckedChange={setAutoPublish} data-testid="switch-auto-publish"/>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {autoPublish
            ? "New articles will be automatically processed and scheduled"
            : "New articles need manual review before posting"}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2 px-2">
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">AI Generated Image</Label>
                    <Switch checked={useAiImage} onCheckedChange={setUseAiImage} data-testid="switch-use-ai-image"/>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {useAiImage
            ? "Images will be generated by AI based on the caption"
            : "Images will be searched from stock photo sources"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Target Platforms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Target Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {[
            { id: "instagram", label: "Instagram" },
            { id: "facebook", label: "Facebook" },
            { id: "twitter", label: "Twitter (X)" },
            { id: "linkedin", label: "LinkedIn" },
            { id: "telegram", label: "Telegram" },
            { id: "pinterest", label: "Pinterest" },
            { id: "tiktok", label: "TikTok" },
            { id: "youtube", label: "YouTube" }
        ].map(function (platform) { return (<div key={platform.id} className={"\n                        flex items-center space-x-3 border rounded-md p-3 cursor-pointer transition-colors\n                        ".concat(selectedPlatforms.includes(platform.id)
                ? "bg-primary/10 border-primary"
                : "hover:bg-muted/50 border-input", "\n                      ")} onClick={function () { return togglePlatform(platform.id); }} data-testid={"platform-".concat(platform.id)}>
                      <Checkbox id={platform.id} checked={selectedPlatforms.includes(platform.id)} onCheckedChange={function () { return togglePlatform(platform.id); }} className="pointer-events-none"/>
                      <label className="text-sm font-medium cursor-pointer pointer-events-none">
                        {platform.label}
                      </label>
                    </div>); })}
                </div>
              </CardContent>
            </Card>

            {/* Safety Constraints */}
            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                  <ShieldAlert className="h-4 w-4"/> Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Forbidden Terms</Label>
                  <Input className="h-8 text-xs" value={safetyForbiddenTerms} onChange={function (e) { return setSafetyForbiddenTerms(e.target.value); }} placeholder="e.g., scam, hack" data-testid="input-forbidden-terms"/>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Length</Label>
                  <Input type="number" className="h-8 text-xs" value={safetyMaxLength} onChange={function (e) { return setSafetyMaxLength(parseInt(e.target.value) || 2000); }} data-testid="input-max-length"/>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>);
}

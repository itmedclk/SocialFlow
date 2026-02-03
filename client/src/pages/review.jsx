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
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, X, ExternalLink, Sparkles, ImageIcon, MessageSquare, Save, Wand2, Search, CalendarClock, Send, ChevronLeft, ChevronRight, Trash2, } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
export default function Review() {
    var _this = this;
    var toast = useToast().toast;
    var _a = useState([]), campaigns = _a[0], setCampaigns = _a[1];
    var _b = useState([]), posts = _b[0], setPosts = _b[1];
    var _c = useState("all"), selectedCampaign = _c[0], setSelectedCampaign = _c[1];
    var _d = useState(0), selectedPostIndex = _d[0], setSelectedPostIndex = _d[1];
    var _e = useState(true), loading = _e[0], setLoading = _e[1];
    var _f = useState(""), prompt = _f[0], setPrompt = _f[1];
    var _g = useState(""), caption = _g[0], setCaption = _g[1];
    var _h = useState(null), globalSettings = _h[0], setGlobalSettings = _h[1];
    var _j = useState(false), promptModified = _j[0], setPromptModified = _j[1];
    var _k = useState(false), savingPrompt = _k[0], setSavingPrompt = _k[1];
    var _l = useState(""), scheduleDate = _l[0], setScheduleDate = _l[1];
    var _m = useState(""), scheduleTime = _m[0], setScheduleTime = _m[1];
    var _o = useState(false), isScheduleDialogOpen = _o[0], setIsScheduleDialogOpen = _o[1];
    var _p = useState(null), userModel = _p[0], setUserModel = _p[1];
    var _q = useState(false), generating = _q[0], setGenerating = _q[1];
    var _r = useState(false), searchingImage = _r[0], setSearchingImage = _r[1];
    var _s = useState(false), generatingImage = _s[0], setGeneratingImage = _s[1];
    var _t = useState({}), imageOffsets = _t[0], setImageOffsets = _t[1];
    var _u = useState(false), clearingArticles = _u[0], setClearingArticles = _u[1];
    var fetchGlobalSettings = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/settings", { credentials: "include" })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setGlobalSettings(data);
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error fetching global settings:", error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var fetchCampaigns = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/campaigns", { credentials: "include" })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Failed to fetch campaigns");
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setCampaigns(data);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error("Error fetching campaigns:", error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var fetchPosts = function (campaignId) { return __awaiter(_this, void 0, void 0, function () {
        var params, postId, url, response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    params = new URLSearchParams(window.location.search);
                    postId = params.get("postId");
                    url = campaignId
                        ? "/api/posts?campaignId=".concat(campaignId, "&status=draft").concat(postId ? "&includePostId=".concat(postId) : "")
                        : "/api/posts?status=draft".concat(postId ? "&includePostId=".concat(postId) : "");
                    return [4 /*yield*/, fetch(url, { credentials: "include" })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Failed to fetch posts");
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setPosts(data);
                    setSelectedPostIndex(0);
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    console.error("Error fetching posts:", error_3);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var fetchUserSettings = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/settings", { credentials: "include" })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setUserModel(data.aiModel);
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    console.error("Error fetching user settings:", error_4);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        fetchCampaigns();
        fetchPosts();
        fetchGlobalSettings();
        fetchUserSettings();
    }, []);
    useEffect(function () {
        if (selectedCampaign !== "all") {
            fetchPosts(parseInt(selectedCampaign));
        }
        else {
            fetchPosts();
        }
    }, [selectedCampaign]);
    useEffect(function () {
        if (posts.length > 0 && posts[selectedPostIndex]) {
            setCaption(posts[selectedPostIndex].generatedCaption || "");
            // Smart default scheduling
            var now = new Date();
            var defaultDate = new Date(now.getTime() + 3600000);
            setScheduleDate(defaultDate.toISOString().split('T')[0]);
            setScheduleTime(defaultDate.toTimeString().split(' ')[0].substring(0, 5));
        }
    }, [selectedPostIndex, posts]);
    useEffect(function () {
        var defaultPrompt = "You are an expert social media manager. Generate an engaging Instagram caption for the following news article. Include relevant hashtags.";
        if (selectedCampaign === "all") {
            if (globalSettings === null || globalSettings === void 0 ? void 0 : globalSettings.globalAiPrompt) {
                setPrompt(globalSettings.globalAiPrompt);
            }
            else {
                setPrompt(defaultPrompt);
            }
        }
        else {
            var campaign = campaigns.find(function (c) { return c.id.toString() === selectedCampaign; });
            if (campaign === null || campaign === void 0 ? void 0 : campaign.aiPrompt) {
                setPrompt(campaign.aiPrompt);
            }
            else if (globalSettings === null || globalSettings === void 0 ? void 0 : globalSettings.globalAiPrompt) {
                setPrompt(globalSettings.globalAiPrompt);
            }
            else {
                setPrompt(defaultPrompt);
            }
        }
        setPromptModified(false);
    }, [selectedCampaign, campaigns, globalSettings]);
    var currentPost = posts[selectedPostIndex];
    var activeCampaign = campaigns.find(function (c) { return c.id.toString() === selectedCampaign; }) || (selectedCampaign === "all" ? null : campaigns[0]);
    useEffect(function () {
        if (currentPost && selectedCampaign === "all") {
            var postCampaign = campaigns.find(function (c) { return c.id === currentPost.campaignId; });
            if (postCampaign === null || postCampaign === void 0 ? void 0 : postCampaign.aiPrompt) {
                setPrompt(postCampaign.aiPrompt);
            }
            else if (globalSettings === null || globalSettings === void 0 ? void 0 : globalSettings.globalAiPrompt) {
                setPrompt(globalSettings.globalAiPrompt);
            }
        }
    }, [currentPost, selectedCampaign, campaigns, globalSettings]);
    var handleSavePrompt = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!activeCampaign) {
                        toast({
                            title: "No Campaign Selected",
                            description: "Please select a specific campaign to save the prompt.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setSavingPrompt(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch("/api/campaigns/".concat(activeCampaign.id, "/prompt"), {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ aiPrompt: prompt }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Failed to save prompt");
                    setCampaigns(function (prev) {
                        return prev.map(function (c) {
                            return c.id === activeCampaign.id ? __assign(__assign({}, c), { aiPrompt: prompt }) : c;
                        });
                    });
                    setPromptModified(false);
                    toast({
                        title: "Prompt Saved",
                        description: "Campaign prompt has been updated.",
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_5 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to save prompt to campaign",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setSavingPrompt(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        var params = new URLSearchParams(window.location.search);
        var postId = params.get("postId");
        if (postId && posts.length > 0) {
            var index = posts.findIndex(function (p) { return p.id.toString() === postId; });
            if (index !== -1) {
                setSelectedPostIndex(index);
            }
        }
    }, [posts]);
    var handleFetchNew = function () { return __awaiter(_this, void 0, void 0, function () {
        var campaignToUse, response, result, campaignId, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    campaignToUse = activeCampaign || campaigns[0];
                    if (!campaignToUse) {
                        toast({
                            title: "No Campaign Available",
                            description: "Please create a campaign first",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("/api/campaigns/".concat(campaignToUse.id, "/fetch"), {
                            method: "POST",
                            credentials: "include",
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    toast({
                        title: "Fetch Complete",
                        description: result.message,
                    });
                    campaignId = activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.id;
                    return [4 /*yield*/, fetchPosts(campaignId)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_6 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to fetch new articles",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleSaveDraft = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ generatedCaption: caption }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Failed to save");
                    toast({
                        title: "Draft Saved",
                        description: "Content saved to drafts for later review.",
                    });
                    return [4 /*yield*/, fetchPosts(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.id)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_7 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to save draft",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleScheduleConfirm = function () { return __awaiter(_this, void 0, void 0, function () {
        var scheduledFor, response, errorData, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    scheduledFor = new Date("".concat(scheduleDate, "T").concat(scheduleTime));
                    if (isNaN(scheduledFor.getTime())) {
                        toast({
                            title: "Invalid Date",
                            description: "Please select a valid date and time.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id), {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                status: "scheduled",
                                generatedCaption: caption,
                                scheduledFor: scheduledFor.toISOString(),
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    errorData = _a.sent();
                    throw new Error(errorData.error || "Failed to schedule");
                case 4: return [4 /*yield*/, fetch("/api/logs", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({
                            campaignId: currentPost.campaignId,
                            postId: currentPost.id,
                            level: "info",
                            message: "Post \"".concat(currentPost.sourceTitle, "\" scheduled for ").concat(scheduledFor.toLocaleString()),
                            metadata: { scheduledFor: scheduledFor.toISOString() }
                        }),
                    })];
                case 5:
                    _a.sent();
                    toast({
                        title: "Scheduled",
                        description: "Post queued for ".concat(scheduledFor.toLocaleString(), "."),
                    });
                    setIsScheduleDialogOpen(false);
                    return [4 /*yield*/, fetchPosts(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.id)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_8 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to schedule post",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handlePost = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, result, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id, "/publish"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                generatedCaption: caption,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    throw new Error(result.error || "Failed to post");
                case 4:
                    toast({
                        title: "Posted Successfully",
                        description: "Content has been sent to Postly.ai.",
                    });
                    return [4 /*yield*/, fetchPosts(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.id)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    error_9 = _a.sent();
                    toast({
                        title: "Error",
                        description: error_9 instanceof Error ? error_9.message : "Failed to publish post",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleReprocess = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, result, error_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost || !activeCampaign)
                        return [2 /*return*/];
                    setGenerating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id, "/generate"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                prompt: prompt || activeCampaign.aiPrompt,
                                campaignId: activeCampaign.id,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error(result.error || "Failed to re-process post");
                    }
                    toast({
                        title: "Post Re-processed",
                        description: "The post has been re-processed with the latest safety rules.",
                    });
                    if (result.post) {
                        setCaption(result.post.generatedCaption || "");
                    }
                    return [4 /*yield*/, fetchPosts(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.id)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 5:
                    error_10 = _a.sent();
                    toast({
                        title: "Re-processing Failed",
                        description: error_10 instanceof Error ? error_10.message : "Failed to re-process",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 7];
                case 6:
                    setGenerating(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleSearchImage = function () { return __awaiter(_this, void 0, void 0, function () {
        var currentOffset, nextOffset, response, result_1, error_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost)
                        return [2 /*return*/];
                    currentOffset = imageOffsets[currentPost.id] || 0;
                    nextOffset = currentOffset + 1;
                    setSearchingImage(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id, "/search-image?offset=").concat(currentOffset), {
                            method: "POST",
                            credentials: "include",
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result_1 = _a.sent();
                    if (!response.ok) {
                        throw new Error(result_1.error || "Failed to search for image");
                    }
                    if (result_1.success) {
                        toast({
                            title: "Image Found",
                            description: "Result #".concat(currentOffset + 1, " added to the post."),
                        });
                        // Update offset for next click
                        setImageOffsets(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[currentPost.id] = nextOffset, _a)));
                        });
                        // Update the posts list
                        setPosts(function (prev) {
                            var newPosts = __spreadArray([], prev, true);
                            var index = newPosts.findIndex(function (p) { return p.id === result_1.post.id; });
                            if (index !== -1) {
                                newPosts[index] = __assign(__assign({}, newPosts[index]), { imageUrl: result_1.post.imageUrl, imageCredit: result_1.post.imageCredit });
                            }
                            return newPosts;
                        });
                    }
                    else {
                        // If no more results, reset offset and notify
                        setImageOffsets(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[currentPost.id] = 0, _a)));
                        });
                        toast({
                            title: "No More Images",
                            description: "Reached the end of search results. Restarting from the first result.",
                            variant: "default",
                        });
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_11 = _a.sent();
                    toast({
                        title: "Image Search Failed",
                        description: error_11 instanceof Error ? error_11.message : "Failed to search for image",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setSearchingImage(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleGenerateAiImage = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, result_2, error_12;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost)
                        return [2 /*return*/];
                    if (!currentPost.generatedCaption) {
                        toast({
                            title: "Caption Required",
                            description: "Please generate a caption first before generating an AI image.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setGeneratingImage(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id, "/generate-image"), {
                            method: "POST",
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result_2 = _a.sent();
                    if (!response.ok) {
                        throw new Error(result_2.error || "Failed to generate image");
                    }
                    if (result_2.success) {
                        toast({
                            title: "Image Generated",
                            description: "AI image has been generated and added to the post.",
                        });
                        setPosts(function (prev) {
                            var newPosts = __spreadArray([], prev, true);
                            var index = newPosts.findIndex(function (p) { return p.id === result_2.post.id; });
                            if (index !== -1) {
                                newPosts[index] = __assign(__assign({}, newPosts[index]), { imageUrl: result_2.post.imageUrl, imageCredit: result_2.post.imageCredit });
                            }
                            return newPosts;
                        });
                    }
                    else {
                        toast({
                            title: "Generation Failed",
                            description: result_2.message || "Failed to generate AI image",
                            variant: "destructive",
                        });
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_12 = _a.sent();
                    toast({
                        title: "Image Generation Failed",
                        description: error_12 instanceof Error ? error_12.message : "Failed to generate AI image",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setGeneratingImage(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleClearArticles = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, result, error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selectedCampaign === "all") {
                        toast({
                            title: "Select a Campaign",
                            description: "Please select a specific campaign to clear articles.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    setClearingArticles(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/campaigns/".concat(selectedCampaign, "/posts/all"), {
                            method: "DELETE",
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (!response.ok) {
                        throw new Error(result.error || "Failed to clear articles");
                    }
                    toast({
                        title: "Articles Cleared",
                        description: "Cleared ".concat(result.deletedCount, " article(s) from this campaign."),
                    });
                    fetchPosts(parseInt(selectedCampaign));
                    return [3 /*break*/, 6];
                case 4:
                    error_13 = _a.sent();
                    toast({
                        title: "Clear Failed",
                        description: error_13 instanceof Error ? error_13.message : "Failed to clear articles",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setClearingArticles(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleRegenerate = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, result_3, error_14;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost || !activeCampaign)
                        return [2 /*return*/];
                    setGenerating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id, "/generate"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                prompt: prompt || activeCampaign.aiPrompt,
                                campaignId: activeCampaign.id,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result_3 = _a.sent();
                    if (!response.ok) {
                        throw new Error(result_3.error || "Failed to generate content");
                    }
                    toast({
                        title: "Content Generated",
                        description: "AI has generated a new caption for this post.",
                    });
                    if (result_3.post) {
                        setCaption(result_3.post.generatedCaption || "");
                    }
                    //await fetchPosts(activeCampaign?.id);
                    // BUGFIX: Update the posts array with the new caption
                    setPosts(function (prev) {
                        return prev.map(function (p) {
                            return p.id === currentPost.id
                                ? __assign(__assign({}, p), { generatedCaption: result_3.post.generatedCaption, aiModel: result_3.post.aiModel }) : p;
                        });
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_14 = _a.sent();
                    toast({
                        title: "Generation Failed",
                        description: error_14 instanceof Error
                            ? error_14.message
                            : "Failed to generate content. Make sure AI_API_KEY is configured.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setGenerating(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleReject = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_15;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentPost)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/posts/".concat(currentPost.id, "/reject"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ reason: "Rejected by user" }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Failed to reject");
                    toast({
                        title: "Post Rejected",
                        description: "This post has been marked as rejected.",
                    });
                    return [4 /*yield*/, fetchPosts(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.id)];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_15 = _a.sent();
                    toast({
                        title: "Error",
                        description: "Failed to reject post",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (<Layout>
      <div className="space-y-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and refine AI-generated drafts before scheduling.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border rounded-lg bg-card shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center flex-1">
            <div className="w-[250px]">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger data-testid="select-campaign">
                  <SelectValue placeholder="Select Campaign"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(function (campaign) { return (<SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>); })}
                </SelectContent>
              </Select>
            </div>
            <Button variant="secondary" className="gap-2" onClick={handleFetchNew} disabled={!activeCampaign && campaigns.length === 0} data-testid="button-fetch-new">
              <Search className="h-4 w-4"/>
              Find New Article
            </Button>

            {selectedCampaign !== "all" && (<Button variant="outline" className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleClearArticles} disabled={clearingArticles || posts.length === 0} data-testid="button-clear-articles">
                {clearingArticles ? (<RefreshCw className="h-4 w-4 animate-spin"/>) : (<Trash2 className="h-4 w-4"/>)}
                Clear All Articles
              </Button>)}

            {posts.length > 1 && (<div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={function () {
                return setSelectedPostIndex(Math.max(0, selectedPostIndex - 1));
            }} disabled={selectedPostIndex === 0}>
                  <ChevronLeft className="h-4 w-4"/>
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedPostIndex + 1} / {posts.length}
                </span>
                <Button variant="ghost" size="icon" onClick={function () {
                return setSelectedPostIndex(Math.min(posts.length - 1, selectedPostIndex + 1));
            }} disabled={selectedPostIndex === posts.length - 1}>
                  <ChevronRight className="h-4 w-4"/>
                </Button>
              </div>)}
          </div>

          <div className="flex gap-2">
            <Button variant="destructive" className="gap-2" onClick={handleReject} disabled={!currentPost} data-testid="button-reject">
              <X className="h-4 w-4"/>
              Reject
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSaveDraft} disabled={!currentPost} data-testid="button-save-draft">
              <Save className="h-4 w-4"/>
              Save Draft
            </Button>
            <Button variant="outline" className="gap-2" onClick={function () { return setIsScheduleDialogOpen(true); }} disabled={!currentPost} data-testid="button-schedule">
              <CalendarClock className="h-4 w-4"/>
              Schedule
            </Button>
            <Button className="gap-2 shadow-lg shadow-primary/25" onClick={handlePost} disabled={!currentPost} data-testid="button-post">
              <Send className="h-4 w-4"/>
              Post
            </Button>
          </div>
        </div>
      </div>

      {loading ? (<div className="text-center py-12 text-muted-foreground">
          Loading posts...
        </div>) : posts.length === 0 ? (<div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No draft posts to review.
          </p>
          <Button onClick={handleFetchNew} disabled={!activeCampaign && campaigns.length === 0}>
            <Search className="h-4 w-4 mr-2"/>
            Fetch New Articles
          </Button>
        </div>) : (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-14rem)]">
          {/* Left Column: Source & Controls */}
          <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-2 pb-4">
            <Card className="flex-none flex flex-col overflow-hidden max-h-[300px]">
              <CardHeader className="pb-3 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-4 w-4"/>
                    Source Article
                  </CardTitle>
                  <div className="flex items-center gap-2">
                      <Badge variant="outline" className={"flex items-center gap-1.5 px-2 py-0.5 text-[10px] ".concat(currentPost.status === 'failed'
                ? 'bg-destructive/10 text-destructive border-destructive/20'
                : 'bg-primary/5 text-primary border-primary/20')}>
                        <CalendarClock className="h-3 w-3"/>
                        {currentPost.status === 'failed' ? 'Failed: ' : 'Scheduled: '}
                        {currentPost.scheduledFor ? new Date(currentPost.scheduledFor).toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }) : 'N/A'}
                      </Badge>
                    <Badge variant="secondary" className="capitalize">{(currentPost === null || currentPost === void 0 ? void 0 : currentPost.status) || "Draft"}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <h3 className="font-bold text-lg mb-1" data-testid="text-source-title">
                  {(currentPost === null || currentPost === void 0 ? void 0 : currentPost.sourceTitle) || "No title"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Source:{" "}
                  {(currentPost === null || currentPost === void 0 ? void 0 : currentPost.sourceUrl)
                ? new URL(currentPost.sourceUrl).hostname
                : "Unknown"}
                  {(currentPost === null || currentPost === void 0 ? void 0 : currentPost.pubDate) && (<> • Published: {new Date(currentPost.pubDate).toLocaleString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })}</>)}
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm">
                  <p>{(currentPost === null || currentPost === void 0 ? void 0 : currentPost.sourceSnippet) || "No content available"}</p>
                </div>
                {(currentPost === null || currentPost === void 0 ? void 0 : currentPost.failureReason) && (<div className="mt-4 p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                    <p className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wider">Publication Error</p>
                    <p className="text-sm text-destructive font-medium">{currentPost.failureReason}</p>
                  </div>)}
              </CardContent>
              <CardFooter className="bg-muted/30 py-2 border-t flex justify-end">
                <Button variant="ghost" size="sm" className="text-xs h-8" asChild>
                  <a href={(currentPost === null || currentPost === void 0 ? void 0 : currentPost.sourceUrl) || "#"} target="_blank" rel="noopener noreferrer">
                    View Original <ExternalLink className="h-3 w-3 ml-1"/>
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4"/>
                    AI Generation Controls
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt" className="text-sm font-medium flex items-center gap-2">
                      AI Prompt Instructions
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        {selectedCampaign === 'all' ? 'Auto-sync active' : 'Campaign specific'}
                      </Badge>
                    </Label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={handleSavePrompt} disabled={!promptModified || savingPrompt || !activeCampaign} data-testid="button-save-prompt">
                        {savingPrompt ? <RefreshCw className="h-3 w-3 animate-spin mr-1"/> : <Save className="h-3 w-3 mr-1"/>}
                        Save to Campaign
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={function () {
                var defaultPrompt = "You are an expert social media manager. Generate an engaging Instagram caption for the following news article. Include relevant hashtags.";
                setPrompt(defaultPrompt);
                setPromptModified(true);
            }}>
                        Reset
                      </Button>
                    </div>
                  </div>
                  <Textarea id="prompt" value={prompt} onChange={function (e) {
                setPrompt(e.target.value);
                setPromptModified(true);
            }} placeholder="Enter instructions for AI content generation..." className="min-h-[120px] text-sm resize-none bg-muted/20 focus:bg-background transition-colors"/>
                  <p className="text-[11px] text-muted-foreground">
                    Modifying this prompt will affect how the AI generates the caption for this specific post and any future posts if saved to the campaign.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(function () {
                var _a;
                var postCampaign = currentPost ? campaigns.find(function (c) { return c.id === currentPost.campaignId; }) : null;
                var useAiImage = (_a = postCampaign === null || postCampaign === void 0 ? void 0 : postCampaign.useAiImage) !== null && _a !== void 0 ? _a : false;
                if (useAiImage) {
                    return (<Button variant="outline" className="gap-2 h-10 border-dashed hover:border-primary hover:text-primary transition-all" onClick={handleGenerateAiImage} disabled={generatingImage || !currentPost || !currentPost.generatedCaption} data-testid="button-generate-image">
                          {generatingImage ? (<RefreshCw className="h-4 w-4 animate-spin"/>) : (<Wand2 className="h-4 w-4"/>)}
                          Generate AI Image
                        </Button>);
                }
                return (<Button variant="outline" className="gap-2 h-10 border-dashed hover:border-primary hover:text-primary transition-all" onClick={handleSearchImage} disabled={searchingImage || !currentPost} data-testid="button-search-image">
                        {searchingImage ? (<RefreshCw className="h-4 w-4 animate-spin"/>) : (<ImageIcon className="h-4 w-4"/>)}
                        Find Better Image
                      </Button>);
            })()}
                  <Button variant="outline" className="gap-2 h-10 border-dashed hover:border-primary hover:text-primary transition-all" onClick={handleRegenerate} disabled={generating || !currentPost} data-testid="button-regenerate">
                    {generating ? (<RefreshCw className="h-4 w-4 animate-spin"/>) : (<Sparkles className="h-4 w-4"/>)}
                    Regenerate AI Content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview & Editor */}
          <div className="flex flex-col h-full overflow-hidden">
            <Card className="flex-1 flex flex-col overflow-hidden border-primary/20 shadow-lg">
              <CardHeader className="py-3 bg-muted/30 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary"/>
                    Post Preview
                  </CardTitle>
                  <Badge variant="outline" className="font-mono text-[10px] bg-background">
                    Preview Mode
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 pt-2 border-b bg-muted/10">
                    <TabsList className="h-8 bg-transparent gap-4">
                      <TabsTrigger value="preview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 h-8 text-xs font-semibold">
                        Visual Preview
                      </TabsTrigger>
                      <TabsTrigger value="edit" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 h-8 text-xs font-semibold">
                        Edit Caption
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="preview" className="flex-1 overflow-y-auto p-4 m-0 bg-slate-50 dark:bg-slate-900/50">
                    {/* Mock Post */}
                    <div className="max-w-[400px] mx-auto bg-card border rounded-xl overflow-hidden shadow-sm">
                      <div className="p-3 flex items-center gap-3 border-b">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          SF
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold leading-none">
                            SocialFlow Auto
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.name) || "Draft Post"}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4 text-muted-foreground"/>
                        </Button>
                      </div>

                      <div className="aspect-square bg-muted relative group">
                        {(currentPost === null || currentPost === void 0 ? void 0 : currentPost.imageUrl) ? (<img src={currentPost.imageUrl} alt="Post content" className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <ImageIcon className="h-10 w-10 opacity-20"/>
                            <p className="text-xs">No image selected</p>
                          </div>)}
                        {(currentPost === null || currentPost === void 0 ? void 0 : currentPost.imageCredit) && (<div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {currentPost.imageCredit}
                          </div>)}
                      </div>

                      <div className="p-3 space-y-2">
                        <div className="flex gap-3">
                          <MessageSquare className="h-5 w-5"/>
                          <Send className="h-5 w-5"/>
                          <div className="flex-1"/>
                          <Badge variant="outline" className="text-[9px] font-mono py-0 h-4 border-primary/20 text-primary">
                            {(currentPost === null || currentPost === void 0 ? void 0 : currentPost.aiModel) || userModel || "Default Model"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs">
                            <span className="font-bold mr-2">socialflow_auto</span>
                            <div className="whitespace-pre-wrap">{caption}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="edit" className="flex-1 p-4 m-0 flex flex-col">
                    <Label htmlFor="caption-editor" className="text-xs font-semibold mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-3 w-3"/>
                        Final Caption Editor
                      </div>
                      {(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.safetyMaxLength) && (<span className={"text-[10px] font-medium ".concat(caption.length > activeCampaign.safetyMaxLength ? 'text-destructive' : 'text-muted-foreground')}>
                          Limit: {activeCampaign.safetyMaxLength}
                        </span>)}
                    </Label>
                    <Textarea id="caption-editor" value={caption} onChange={function (e) { return setCaption(e.target.value); }} placeholder="The generated caption will appear here..." className={"flex-1 min-h-[300px] text-sm font-sans leading-relaxed focus:ring-1 ".concat((activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.safetyMaxLength) && caption.length > activeCampaign.safetyMaxLength ? 'border-destructive focus:ring-destructive/30' : 'focus:ring-primary/30')} data-testid="input-caption"/>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className={"text-[10px] font-medium ".concat((activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.safetyMaxLength) && caption.length > activeCampaign.safetyMaxLength ? 'text-destructive' : 'text-muted-foreground')}>
                          {caption.length} characters • {caption.split(/\s+/).filter(Boolean).length} words
                        </p>
                        {(activeCampaign === null || activeCampaign === void 0 ? void 0 : activeCampaign.safetyMaxLength) && caption.length > activeCampaign.safetyMaxLength && (<p className="text-[9px] text-destructive font-bold animate-pulse">
                            Warning: Caption exceeds campaign length limit!
                          </p>)}
                      </div>
                      <Button variant="link" size="sm" className="h-6 text-[10px] p-0" onClick={function () { return setCaption((currentPost === null || currentPost === void 0 ? void 0 : currentPost.generatedCaption) || ""); }}>
                        Discard manual changes
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>)}

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
            <DialogDescription>
              Choose when you want this post to be published. All times are in 24-hour format.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input id="date" type="date" className="col-span-3" value={scheduleDate} onChange={function (e) { return setScheduleDate(e.target.value); }}/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time (24h)
              </Label>
              <Input id="time" type="time" className="col-span-3" value={scheduleTime} onChange={function (e) { return setScheduleTime(e.target.value); }}/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={function () { return setIsScheduleDialogOpen(false); }}>
              Cancel
            </Button>
            <Button onClick={handleScheduleConfirm}>Confirm Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>);
}

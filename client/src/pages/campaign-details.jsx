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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarClock, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
export default function CampaignDetails() {
    var _this = this;
    var id = useParams().id;
    var _a = useState(null), campaign = _a[0], setCampaign = _a[1];
    var _b = useState([]), posts = _b[0], setPosts = _b[1];
    var _c = useState("all"), filter = _c[0], setFilter = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    useEffect(function () {
        if (id) {
            fetchCampaign();
            fetchPosts();
        }
    }, [id]);
    var fetchCampaign = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetch("/api/campaigns/".concat(id))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setCampaign(data);
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Error fetching campaign:", error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var fetchPosts = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, 5, 6]);
                    setLoading(true);
                    return [4 /*yield*/, fetch("/api/posts?campaignId=".concat(id))];
                case 1:
                    response = _a.sent();
                    if (!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setPosts(data);
                    _a.label = 3;
                case 3: return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    console.error("Error fetching posts:", error_2);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var filteredPosts = posts
        .filter(function (post) {
        if (filter === "all")
            return ["posted", "failed", "scheduled"].includes(post.status);
        return post.status === filter;
    })
        .sort(function (a, b) {
        if (filter === "scheduled") {
            var dateA_1 = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
            var dateB_1 = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
            return dateA_1 - dateB_1;
        }
        var dateA = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.createdAt).getTime();
        var dateB = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
    });
    return (<Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5"/>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {(campaign === null || campaign === void 0 ? void 0 : campaign.name) || "Campaign Details"}
            </h1>
            <p className="text-muted-foreground mt-1">
              View all generated posts and their delivery status.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-bold">Post History</CardTitle>
            <div className="w-[180px]">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Posts</SelectItem>
                  <SelectItem value="posted">Posted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (<div className="text-center py-8 text-muted-foreground">Loading posts...</div>) : filteredPosts.length === 0 ? (<div className="text-center py-8 text-muted-foreground">No posts found for this filter.</div>) : (<Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>AI Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      {filter === "scheduled" ? "Scheduled For" : "Date Posted"}
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map(function (post) { return (<TableRow key={post.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {post.sourceTitle}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {post.aiModel || "N/A"}
                      </TableCell>
                      <TableCell>
                        {post.status === "posted" && (<Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                            <CheckCircle2 className="h-3 w-3"/> Posted
                          </Badge>)}
                        {post.status === "failed" && (<Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3"/> Failed
                          </Badge>)}
                        {post.status === "scheduled" && (<Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
                            <CalendarClock className="h-3 w-3"/> Scheduled
                          </Badge>)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.status === "scheduled" && post.scheduledFor
                    ? new Date(post.scheduledFor).toLocaleString('en-GB', { hour12: false })
                    : post.postedAt
                        ? new Date(post.postedAt).toLocaleString('en-GB', { hour12: false })
                        : new Date(post.createdAt).toLocaleString('en-GB', { hour12: false })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={"/review?postId=".concat(post.id)}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2"/>
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>); })}
                </TableBody>
              </Table>)}
          </CardContent>
        </Card>
      </div>
    </Layout>);
}

it shows TZ is Los Angeles, but I Set the scheduler as 8:30, it shows 16:30, I set every x hours, it shows next time is 19:00, try to fix the mismatchimport { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, Filter, CalendarClock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import type { Campaign, Post } from "@shared/schema";

const PAGE_SIZE = 20;

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "posted", label: "Posted" },
  { value: "failed", label: "Failed" },
];

export default function Pipeline() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCampaignId]);

  useEffect(() => {
    setPage(1);
  }, [selectedCampaignId, statusFilter]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = selectedCampaignId !== "all"
        ? `/api/posts?campaignId=${selectedCampaignId}`
        : "/api/posts";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const campaignNameById = useMemo(() => {
    const map = new Map<number, string>();
    campaigns.forEach((campaign) => map.set(campaign.id, campaign.name));
    return map;
  }, [campaigns]);

  const filteredPosts = useMemo(() => {
    const byStatus = statusFilter === "all"
      ? posts
      : posts.filter((post) => post.status === statusFilter);

    return [...byStatus].sort((a, b) => {
      const timeA = (a.postedAt || a.scheduledFor || a.createdAt) ? new Date(a.postedAt || a.scheduledFor || a.createdAt!).getTime() : 0;
      const timeB = (b.postedAt || b.scheduledFor || b.createdAt) ? new Date(b.postedAt || b.scheduledFor || b.createdAt!).getTime() : 0;
      return timeB - timeA;
    });
  }, [posts, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const pagedPosts = filteredPosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (post: Post) => {
    const target = post.status === "scheduled" && post.scheduledFor
      ? post.scheduledFor
      : post.postedAt || post.createdAt;
    if (!target) return "--";
    return new Date(target).toLocaleString("en-GB", { hour12: false });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Post History</h1>
            <p className="text-muted-foreground mt-1">
              Browse all posts across campaigns with filters and history.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
            <div className="w-[220px]">
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="h-9" data-testid="select-post-history-campaign">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="All Campaigns" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9" data-testid="select-post-history-status">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="All Statuses" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Post History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
            ) : pagedPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No posts found.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaignNameById.get(post.campaignId) || `Campaign ${post.campaignId}`}
                      </TableCell>
                      <TableCell className="font-medium max-w-[320px] truncate">
                        {post.sourceTitle}
                      </TableCell>
                      <TableCell>
                        {post.status === "posted" && (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Posted
                          </Badge>
                        )}
                        {post.status === "failed" && (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" /> Failed
                          </Badge>
                        )}
                        {post.status === "scheduled" && (
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1">
                            <CalendarClock className="h-3 w-3" /> Scheduled
                          </Badge>
                        )}
                        {post.status === "draft" && (
                          <Badge variant="secondary" className="gap-1">
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(post)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/review?postId=${post.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
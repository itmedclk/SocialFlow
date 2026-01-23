import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CalendarClock, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import type { Post, Campaign } from "@shared/schema";

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchCampaign();
      fetchPosts();
    }
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCampaign(data);
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?campaignId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts
    .filter((post) => {
      if (filter === "all") return ["posted", "failed", "scheduled"].includes(post.status);
      return post.status === filter;
    })
    .sort((a, b) => {
      if (filter === "scheduled") {
        const dateA = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
        const dateB = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
        return dateA - dateB;
      }
      const dateA = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.createdAt!).getTime();
      const dateB = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.createdAt!).getTime();
      return dateB - dateA;
    });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaign?.name || "Campaign Details"}
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
                  <SelectValue placeholder="Filter by status" />
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
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No posts found for this filter.</div>
            ) : (
              <Table>
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
                  {filteredPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {post.sourceTitle}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {post.aiModel || "N/A"}
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
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {post.status === "scheduled" && post.scheduledFor
                          ? new Date(post.scheduledFor).toLocaleString('en-GB', { hour12: false })
                          : post.postedAt
                          ? new Date(post.postedAt).toLocaleString('en-GB', { hour12: false })
                          : new Date(post.createdAt!).toLocaleString('en-GB', { hour12: false })}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

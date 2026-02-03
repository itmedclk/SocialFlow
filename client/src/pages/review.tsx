import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Sparkles,
  ImageIcon,
  MessageSquare,
  Save,
  Wand2,
  Search,
  CalendarClock,
  Send,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, Post } from "@shared/schema";

interface GlobalSettings {
  globalAiPrompt: string | null;
}

export default function Review() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [promptModified, setPromptModified] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [userModel, setUserModel] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchingImage, setSearchingImage] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageOffsets, setImageOffsets] = useState<Record<number, number>>({});
  const [clearingArticles, setClearingArticles] = useState(false);

  const fetchGlobalSettings = async () => {
    try {
      const response = await fetch("/api/settings", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setGlobalSettings(data);
      }
    } catch (error) {
      console.error("Error fetching global settings:", error);
    }
  };

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

  const fetchPosts = async (campaignId?: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const postId = params.get("postId");
      
      const url = campaignId
        ? `/api/posts?campaignId=${campaignId}&status=draft${postId ? `&includePostId=${postId}` : ""}`
        : `/api/posts?status=draft${postId ? `&includePostId=${postId}` : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data);
      setSelectedPostIndex(0);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSettings = async () => {
    try {
      const response = await fetch("/api/settings", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setUserModel(data.aiModel);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchPosts();
    fetchGlobalSettings();
    fetchUserSettings();
  }, []);

  useEffect(() => {
    if (selectedCampaign !== "all") {
      fetchPosts(parseInt(selectedCampaign));
    } else {
      fetchPosts();
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (posts.length > 0 && posts[selectedPostIndex]) {
      setCaption(posts[selectedPostIndex].generatedCaption || "");
      
      // Smart default scheduling
      const now = new Date();
      const defaultDate = new Date(now.getTime() + 3600000);
      setScheduleDate(defaultDate.toISOString().split('T')[0]);
      setScheduleTime(defaultDate.toTimeString().split(' ')[0].substring(0, 5));
    }
  }, [selectedPostIndex, posts]);

  useEffect(() => {
    const defaultPrompt = "You are an expert social media manager. Generate an engaging Instagram caption for the following news article. Include relevant hashtags.";
    
    if (selectedCampaign === "all") {
      if (globalSettings?.globalAiPrompt) {
        setPrompt(globalSettings.globalAiPrompt);
      } else {
        setPrompt(defaultPrompt);
      }
    } else {
      const campaign = campaigns.find((c) => c.id.toString() === selectedCampaign);
      if (campaign?.aiPrompt) {
        setPrompt(campaign.aiPrompt);
      } else if (globalSettings?.globalAiPrompt) {
        setPrompt(globalSettings.globalAiPrompt);
      } else {
        setPrompt(defaultPrompt);
      }
    }
    setPromptModified(false);
  }, [selectedCampaign, campaigns, globalSettings]);

  const currentPost = posts[selectedPostIndex];
  const activeCampaign =
    campaigns.find((c) => c.id.toString() === selectedCampaign) || (selectedCampaign === "all" ? null : campaigns[0]);

  useEffect(() => {
    if (currentPost && selectedCampaign === "all") {
      const postCampaign = campaigns.find(c => c.id === currentPost.campaignId);
      if (postCampaign?.aiPrompt) {
        setPrompt(postCampaign.aiPrompt);
      } else if (globalSettings?.globalAiPrompt) {
        setPrompt(globalSettings.globalAiPrompt);
      }
    }
  }, [currentPost, selectedCampaign, campaigns, globalSettings]);

  const handleSavePrompt = async () => {
    if (!activeCampaign) {
      toast({
        title: "No Campaign Selected",
        description: "Please select a specific campaign to save the prompt.",
        variant: "destructive",
      });
      return;
    }

    setSavingPrompt(true);
    try {
      const response = await fetch(`/api/campaigns/${activeCampaign.id}/prompt`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ aiPrompt: prompt }),
      });

      if (!response.ok) throw new Error("Failed to save prompt");

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === activeCampaign.id ? { ...c, aiPrompt: prompt } : c
        )
      );
      setPromptModified(false);

      toast({
        title: "Prompt Saved",
        description: "Campaign prompt has been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save prompt to campaign",
        variant: "destructive",
      });
    } finally {
      setSavingPrompt(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get("postId");
    if (postId && posts.length > 0) {
      const index = posts.findIndex(p => p.id.toString() === postId);
      if (index !== -1) {
        setSelectedPostIndex(index);
      }
    }
  }, [posts]);

  const handleFetchNew = async () => {
    const campaignToUse = activeCampaign || campaigns[0];
    if (!campaignToUse) {
      toast({
        title: "No Campaign Available",
        description: "Please create a campaign first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/campaigns/${campaignToUse.id}/fetch`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const result = await response.json();

      toast({
        title: "Fetch Complete",
        description: result.message,
      });

      const campaignId = activeCampaign?.id;
      await fetchPosts(campaignId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch new articles",
        variant: "destructive",
      });
    }
  };

  const handleSaveDraft = async () => {
    if (!currentPost) return;

    try {
      const response = await fetch(`/api/posts/${currentPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ generatedCaption: caption }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast({
        title: "Draft Saved",
        description: "Content saved to drafts for later review.",
      });

      await fetchPosts(activeCampaign?.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive",
      });
    }
  };

  const handleScheduleConfirm = async () => {
    if (!currentPost) return;

    try {
      const scheduledFor = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledFor.getTime())) {
        toast({
          title: "Invalid Date",
          description: "Please select a valid date and time.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/posts/${currentPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: "scheduled",
          generatedCaption: caption,
          scheduledFor: scheduledFor.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to schedule");
      }

      await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          campaignId: currentPost.campaignId,
          postId: currentPost.id,
          level: "info",
          message: `Post \"${currentPost.sourceTitle}\" scheduled for ${scheduledFor.toLocaleString()}`,
          metadata: { scheduledFor: scheduledFor.toISOString() }
        }),
      });

      toast({
        title: "Scheduled",
        description: `Post queued for ${scheduledFor.toLocaleString()}.`,
      });

      setIsScheduleDialogOpen(false);
      await fetchPosts(activeCampaign?.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule post",
        variant: "destructive",
      });
    }
  };

  const handlePost = async () => {
    if (!currentPost) return;

    try {
      const response = await fetch(`/api/posts/${currentPost.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          generatedCaption: caption,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to post");
      }

      toast({
        title: "Posted Successfully",
        description: "Content has been sent to Postly.ai.",
      });

      await fetchPosts(activeCampaign?.id);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to publish post",
        variant: "destructive",
      });
    }
  };

  const handleReprocess = async () => {
    if (!currentPost || !activeCampaign) return;
    
    setGenerating(true);
    try {
      const response = await fetch(`/api/posts/${currentPost.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: prompt || activeCampaign.aiPrompt,
          campaignId: activeCampaign.id,
        }),
      });

      const result = await response.json();

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
      
      await fetchPosts(activeCampaign?.id);
    } catch (error) {
      toast({
        title: "Re-processing Failed",
        description: error instanceof Error ? error.message : "Failed to re-process",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSearchImage = async () => {
    if (!currentPost) return;

    const currentOffset = imageOffsets[currentPost.id] || 0;
    const nextOffset = currentOffset + 1;

    setSearchingImage(true);
    try {
      const response = await fetch(`/api/posts/${currentPost.id}/search-image?offset=${currentOffset}`, {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to search for image");
      }

      if (result.success) {
        toast({
          title: "Image Found",
          description: `Result #${currentOffset + 1} added to the post.`,
        });

        // Update offset for next click
        setImageOffsets(prev => ({
          ...prev,
          [currentPost.id]: nextOffset
        }));

        // Update the posts list
        setPosts((prev) => {
          const newPosts = [...prev];
          const index = newPosts.findIndex(p => p.id === result.post.id);
          if (index !== -1) {
            newPosts[index] = {
              ...newPosts[index],
              imageUrl: result.post.imageUrl,
              imageCredit: result.post.imageCredit
            };
          }
          return newPosts;
        });
      } else {
        // If no more results, reset offset and notify
        setImageOffsets(prev => ({
          ...prev,
          [currentPost.id]: 0
        }));
        toast({
          title: "No More Images",
          description: "Reached the end of search results. Restarting from the first result.",
          variant: "default",
        });
      }
    } catch (error) {
      toast({
        title: "Image Search Failed",
        description: error instanceof Error ? error.message : "Failed to search for image",
        variant: "destructive",
      });
    } finally {
      setSearchingImage(false);
    }
  };

  const handleGenerateAiImage = async () => {
    if (!currentPost) return;

    if (!currentPost.generatedCaption) {
      toast({
        title: "Caption Required",
        description: "Please generate a caption first before generating an AI image.",
        variant: "destructive",
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const response = await fetch(`/api/posts/${currentPost.id}/generate-image`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate image");
      }

      if (result.success) {
        toast({
          title: "Image Generated",
          description: "AI image has been generated and added to the post.",
        });

        setPosts((prev) => {
          const newPosts = [...prev];
          const index = newPosts.findIndex(p => p.id === result.post.id);
          if (index !== -1) {
            newPosts[index] = {
              ...newPosts[index],
              imageUrl: result.post.imageUrl,
              imageCredit: result.post.imageCredit
            };
          }
          return newPosts;
        });
      } else {
        toast({
          title: "Generation Failed",
          description: result.message || "Failed to generate AI image",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate AI image",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleClearArticles = async () => {
    if (selectedCampaign === "all") {
      toast({
        title: "Select a Campaign",
        description: "Please select a specific campaign to clear articles.",
        variant: "destructive",
      });
      return;
    }

    setClearingArticles(true);
    try {
      const response = await fetch(`/api/campaigns/${selectedCampaign}/posts/all`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to clear articles");
      }

      toast({
        title: "Articles Cleared",
        description: `Cleared ${result.deletedCount} article(s) from this campaign.`,
      });

      fetchPosts(parseInt(selectedCampaign));
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: error instanceof Error ? error.message : "Failed to clear articles",
        variant: "destructive",
      });
    } finally {
      setClearingArticles(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentPost || !activeCampaign) return;

    setGenerating(true);
    try {
      const response = await fetch(`/api/posts/${currentPost.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: prompt || activeCampaign.aiPrompt,
          campaignId: activeCampaign.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate content");
      }

      toast({
        title: "Content Generated",
        description: "AI has generated a new caption for this post.",
      });

      if (result.post) {
        setCaption(result.post.generatedCaption || "");
      }

      //await fetchPosts(activeCampaign?.id);
      // BUGFIX: Update the posts array with the new caption
      setPosts((prev) =>
        prev.map((p) =>
          p.id === currentPost.id
            ? { ...p, generatedCaption: result.post.generatedCaption, aiModel: result.post.aiModel }
            : p,
        ),
      );
      // END
    } catch (error) {
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate content. Make sure AI_API_KEY is configured.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleReject = async () => {
    if (!currentPost) return;

    try {
      const response = await fetch(`/api/posts/${currentPost.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: "Rejected by user" }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      toast({
        title: "Post Rejected",
        description: "This post has been marked as rejected.",
      });

      await fetchPosts(activeCampaign?.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject post",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
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
              <Select
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
              >
                <SelectTrigger data-testid="select-campaign">
                  <SelectValue placeholder="Select Campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign) => (
                    <SelectItem
                      key={campaign.id}
                      value={campaign.id.toString()}
                    >
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="secondary"
              className="gap-2"
              onClick={handleFetchNew}
              disabled={!activeCampaign && campaigns.length === 0}
              data-testid="button-fetch-new"
            >
              <Search className="h-4 w-4" />
              Find New Article
            </Button>

            {selectedCampaign !== "all" && (
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleClearArticles}
                disabled={clearingArticles || posts.length === 0}
                data-testid="button-clear-articles"
              >
                {clearingArticles ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Clear All Articles
              </Button>
            )}

            {posts.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSelectedPostIndex(Math.max(0, selectedPostIndex - 1))
                  }
                  disabled={selectedPostIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedPostIndex + 1} / {posts.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setSelectedPostIndex(
                      Math.min(posts.length - 1, selectedPostIndex + 1),
                    )
                  }
                  disabled={selectedPostIndex === posts.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleReject}
              disabled={!currentPost}
              data-testid="button-reject"
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleSaveDraft}
              disabled={!currentPost}
              data-testid="button-save-draft"
            >
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setIsScheduleDialogOpen(true)}
              disabled={!currentPost}
              data-testid="button-schedule"
            >
              <CalendarClock className="h-4 w-4" />
              Schedule
            </Button>
            <Button
              className="gap-2 shadow-lg shadow-primary/25"
              onClick={handlePost}
              disabled={!currentPost}
              data-testid="button-post"
            >
              <Send className="h-4 w-4" />
              Post
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No draft posts to review.
          </p>
          <Button onClick={handleFetchNew} disabled={!activeCampaign && campaigns.length === 0}>
            <Search className="h-4 w-4 mr-2" />
            Fetch New Articles
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-14rem)]">
          {/* Left Column: Source & Controls */}
          <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-2 pb-4">
            <Card className="flex-none flex flex-col overflow-hidden max-h-[300px]">
              <CardHeader className="pb-3 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Source Article
                  </CardTitle>
                  <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`flex items-center gap-1.5 px-2 py-0.5 text-[10px] ${
                          currentPost.status === 'failed' 
                            ? 'bg-destructive/10 text-destructive border-destructive/20' 
                            : 'bg-primary/5 text-primary border-primary/20'
                        }`}
                      >
                        <CalendarClock className="h-3 w-3" />
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
                    <Badge variant="secondary" className="capitalize">{currentPost?.status || "Draft"}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <h3
                  className="font-bold text-lg mb-1"
                  data-testid="text-source-title"
                >
                  {currentPost?.sourceTitle || "No title"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Source:{" "}
                  {currentPost?.sourceUrl
                    ? new URL(currentPost.sourceUrl).hostname
                    : "Unknown"}
                  {currentPost?.pubDate && (
                    <> • Published: {new Date(currentPost.pubDate).toLocaleString('en-US', { 
                      month: '2-digit',
                      day: '2-digit', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: false 
                    })}</>
                  )}
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm">
                  <p>{currentPost?.sourceSnippet || "No content available"}</p>
                </div>
                {currentPost?.failureReason && (
                  <div className="mt-4 p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                    <p className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wider">Publication Error</p>
                    <p className="text-sm text-destructive font-medium">{currentPost.failureReason}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 py-2 border-t flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                  asChild
                >
                  <a
                    href={currentPost?.sourceUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Original <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Generation Controls
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="prompt"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      AI Prompt Instructions
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        {selectedCampaign === 'all' ? 'Auto-sync active' : 'Campaign specific'}
                      </Badge>
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={handleSavePrompt}
                        disabled={!promptModified || savingPrompt || !activeCampaign}
                        data-testid="button-save-prompt"
                      >
                        {savingPrompt ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                        Save to Campaign
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => {
                          const defaultPrompt = "You are an expert social media manager. Generate an engaging Instagram caption for the following news article. Include relevant hashtags.";
                          setPrompt(defaultPrompt);
                          setPromptModified(true);
                        }}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setPromptModified(true);
                    }}
                    placeholder="Enter instructions for AI content generation..."
                    className="min-h-[120px] text-sm resize-none bg-muted/20 focus:bg-background transition-colors"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Modifying this prompt will affect how the AI generates the caption for this specific post and any future posts if saved to the campaign.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const postCampaign = currentPost ? campaigns.find(c => c.id === currentPost.campaignId) : null;
                    const useAiImage = postCampaign?.useAiImage ?? false;
                    
                    if (useAiImage) {
                      return (
                        <Button
                          variant="outline"
                          className="gap-2 h-10 border-dashed hover:border-primary hover:text-primary transition-all"
                          onClick={handleGenerateAiImage}
                          disabled={generatingImage || !currentPost || !currentPost.generatedCaption}
                          data-testid="button-generate-image"
                        >
                          {generatingImage ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                          Generate AI Image
                        </Button>
                      );
                    }
                    
                    return (
                      <Button
                        variant="outline"
                        className="gap-2 h-10 border-dashed hover:border-primary hover:text-primary transition-all"
                        onClick={handleSearchImage}
                        disabled={searchingImage || !currentPost}
                        data-testid="button-search-image"
                      >
                        {searchingImage ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="h-4 w-4" />
                        )}
                        Find Better Image
                      </Button>
                    );
                  })()}
                  <Button
                    variant="outline"
                    className="gap-2 h-10 border-dashed hover:border-primary hover:text-primary transition-all"
                    onClick={handleRegenerate}
                    disabled={generating || !currentPost}
                    data-testid="button-regenerate"
                  >
                    {generating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
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
                    <MessageSquare className="h-4 w-4 text-primary" />
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
                      <TabsTrigger
                        value="preview"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 h-8 text-xs font-semibold"
                      >
                        Visual Preview
                      </TabsTrigger>
                      <TabsTrigger
                        value="edit"
                        className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 h-8 text-xs font-semibold"
                      >
                        Edit Caption
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent
                    value="preview"
                    className="flex-1 overflow-y-auto p-4 m-0 bg-slate-50 dark:bg-slate-900/50"
                  >
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
                            {activeCampaign?.name || "Draft Post"}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>

                      <div className="aspect-square bg-muted relative group">
                        {currentPost?.imageUrl ? (
                          <img
                            src={currentPost.imageUrl}
                            alt="Post content"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <ImageIcon className="h-10 w-10 opacity-20" />
                            <p className="text-xs">No image selected</p>
                          </div>
                        )}
                        {currentPost?.imageCredit && (
                          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {currentPost.imageCredit}
                          </div>
                        )}
                      </div>

                      <div className="p-3 space-y-2">
                        <div className="flex gap-3">
                          <MessageSquare className="h-5 w-5" />
                          <Send className="h-5 w-5" />
                          <div className="flex-1" />
                          <Badge variant="outline" className="text-[9px] font-mono py-0 h-4 border-primary/20 text-primary">
                            {currentPost?.aiModel || userModel || "Default Model"}
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
                    <Label
                      htmlFor="caption-editor"
                      className="text-xs font-semibold mb-2 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-3 w-3" />
                        Final Caption Editor
                      </div>
                      {activeCampaign?.safetyMaxLength && (
                        <span className={`text-[10px] font-medium ${caption.length > activeCampaign.safetyMaxLength ? 'text-destructive' : 'text-muted-foreground'}`}>
                          Limit: {activeCampaign.safetyMaxLength}
                        </span>
                      )}
                    </Label>
                    <Textarea
                      id="caption-editor"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="The generated caption will appear here..."
                      className={`flex-1 min-h-[300px] text-sm font-sans leading-relaxed focus:ring-1 ${activeCampaign?.safetyMaxLength && caption.length > activeCampaign.safetyMaxLength ? 'border-destructive focus:ring-destructive/30' : 'focus:ring-primary/30'}`}
                      data-testid="input-caption"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className={`text-[10px] font-medium ${activeCampaign?.safetyMaxLength && caption.length > activeCampaign.safetyMaxLength ? 'text-destructive' : 'text-muted-foreground'}`}>
                          {caption.length} characters • {caption.split(/\s+/).filter(Boolean).length} words
                        </p>
                        {activeCampaign?.safetyMaxLength && caption.length > activeCampaign.safetyMaxLength && (
                          <p className="text-[9px] text-destructive font-bold animate-pulse">
                            Warning: Caption exceeds campaign length limit!
                          </p>
                        )}
                      </div>
                      <Button variant="link" size="sm" className="h-6 text-[10px] p-0" onClick={() => setCaption(currentPost?.generatedCaption || "")}>
                        Discard manual changes
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Schedule Dialog */}
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
      >
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
              <Input
                id="date"
                type="date"
                className="col-span-3"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time (24h)
              </Label>
              <Input
                id="time"
                type="time"
                className="col-span-3"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleScheduleConfirm}>Confirm Schedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

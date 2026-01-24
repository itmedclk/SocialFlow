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
  Image as ImageIcon,
  MessageSquare,
  Save,
  Wand2,
  Search,
  CalendarClock,
  Send,
  ChevronLeft,
  ChevronRight,
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

  useEffect(() => {
    fetchCampaigns();
    fetchPosts();
    fetchGlobalSettings();
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
      const response = await fetch("/api/campaigns");
      if (!response.ok) throw new Error("Failed to fetch campaigns");
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

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

  const fetchPosts = async (campaignId?: number) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const postId = params.get("postId");
      
      const url = campaignId
        ? `/api/posts?campaignId=${campaignId}&status=draft${postId ? `&includePostId=${postId}` : ""}`
        : `/api/posts?status=draft${postId ? `&includePostId=${postId}` : ""}`;
      const response = await fetch(url);
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

  const currentPost = posts[selectedPostIndex];
  const activeCampaign =
    campaigns.find((c) => c.id.toString() === selectedCampaign) || (selectedCampaign === "all" ? null : campaigns[0]);

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

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [userModel, setUserModel] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
    fetchPosts();
    fetchGlobalSettings();
    fetchUserSettings();
  }, []);

  const fetchUserSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const data = await response.json();
        setUserModel(data.aiModel);
      }
    } catch (error) {
      console.error("Error fetching user settings:", error);
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
        body: JSON.stringify({
          campaignId: currentPost.campaignId,
          postId: currentPost.id,
          level: "info",
          message: `Post "${currentPost.sourceTitle}" scheduled for ${scheduledFor.toLocaleString()}`,
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

  const [generating, setGenerating] = useState(false);
  const [searchingImage, setSearchingImage] = useState(false);

  const [imageOffsets, setImageOffsets] = useState<Record<number, number>>({});

  const handleSearchImage = async () => {
    if (!currentPost) return;

    const currentOffset = imageOffsets[currentPost.id] || 0;
    const nextOffset = currentOffset + 1;

    setSearchingImage(true);
    try {
      const response = await fetch(`/api/posts/${currentPost.id}/search-image?offset=${currentOffset}`, {
        method: "POST",
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

  const handleRegenerate = async () => {
    if (!currentPost || !activeCampaign) return;

    setGenerating(true);
    try {
      const response = await fetch(`/api/posts/${currentPost.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
              disabled={!activeCampaign}
              data-testid="button-fetch-new"
            >
              <Search className="h-4 w-4" />
              Find New Article
            </Button>

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
          <Button onClick={handleFetchNew} disabled={!activeCampaign}>
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
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm">
                  <p>{currentPost?.sourceSnippet || "No content available"}</p>
                </div>
                {currentPost?.failureReason && (
                  <div className="mt-4 p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                    <p className="text-xs font-bold text-destructive flex items-center gap-1 mb-1">
                      <X className="h-3 w-3" />
                      Post Failed to Publish
                    </p>
                    <p className="text-xs text-destructive/80 italic">
                      {currentPost.failureReason}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleReprocess}
                      disabled={generating}
                      className="mt-2 h-7 text-[10px] gap-1 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
                      Re-process Post
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/20 border-t py-2">
                {currentPost?.sourceUrl && (
                  <a
                    href={currentPost.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full gap-2 h-8 text-xs"
                    >
                      View Original Source <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-3 py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Generation Controls
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] h-5 bg-muted/50 text-muted-foreground border-muted">
                      AI Model: {currentPost?.aiModel || userModel || "Default"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-5 bg-primary/5 text-primary border-primary/20"
                    >
                      Config: {activeCampaign?.topic || "Default"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Wand2 className="h-3 w-3 text-primary" />
                      System Prompt
                    </Label>
                    {promptModified && selectedCampaign !== "all" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs gap-1"
                        onClick={handleSavePrompt}
                        disabled={savingPrompt}
                        data-testid="button-save-prompt"
                      >
                        <Save className="h-3 w-3" />
                        {savingPrompt ? "Saving..." : "Save to Campaign"}
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={prompt}
                    onChange={(e) => {
                      setPrompt(e.target.value);
                      setPromptModified(true);
                    }}
                    className="min-h-[80px] text-xs leading-relaxed resize-y font-mono bg-muted/20"
                    data-testid="textarea-prompt"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Prompt hierarchy: Review → Campaign → Global Settings
                  </p>
                </div>

                <Button
                  variant="secondary"
                  className="w-full gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={handleRegenerate}
                  disabled={!currentPost || generating}
                  data-testid="button-regenerate"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${generating ? "animate-spin" : ""}`}
                  />
                  {generating ? "Generating..." : "Generate Caption with AI"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview & Edit */}
          <div className="space-y-6 flex flex-col h-full">
            <Tabs defaultValue="caption" className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="caption" className="gap-2">
                    <MessageSquare className="h-4 w-4" /> Caption
                  </TabsTrigger>
                  <TabsTrigger value="image" className="gap-2">
                    <ImageIcon className="h-4 w-4" /> Image
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Draft Content
                </div>
              </div>

              <TabsContent value="caption" className="flex-1 mt-0">
                <Card className="h-full flex flex-col">
                  <CardContent className="flex-1 p-0">
                    <Textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Enter or generate a caption for this post..."
                      className="h-full w-full resize-none border-0 focus-visible:ring-0 p-6 text-base leading-relaxed font-sans"
                      data-testid="textarea-caption"
                    />
                  </CardContent>
                  <CardFooter className="border-t bg-muted/10 py-2 px-4 flex justify-between items-center text-xs text-muted-foreground">
                    <span>{caption.length} / 2200 characters</span>
                    <span>
                      {(caption.match(/#\w+/g) || []).length} hashtags detected
                    </span>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="image" className="flex-1 mt-0">
                <Card className="h-full overflow-hidden flex flex-col">
                  <div className="flex-1 bg-muted/30 relative group flex items-center justify-center min-h-[200px]">
                    {currentPost?.imageUrl ? (
                      <img
                        src={currentPost.imageUrl.replace(/&amp;/g, '&')}
                        alt="Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-center text-muted-foreground p-4">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No image available</p>
                        <p className="text-xs mt-1">
                          Click "Search Image" to find one
                        </p>
                      </div>
                    )}
                  </div>
                  <CardFooter className="border-t p-4 bg-muted/10">
                    <div className="w-full space-y-3">
                      <Button
                        variant="secondary"
                        className="w-full gap-2"
                        onClick={handleSearchImage}
                        disabled={!currentPost || searchingImage}
                        data-testid="button-search-image"
                      >
                        <Search className={`h-4 w-4 ${searchingImage ? "animate-pulse" : ""}`} />
                        {searchingImage ? "Searching..." : "Search Image"}
                      </Button>
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Image Credit</span>
                        <span className="text-muted-foreground truncate ml-2">
                          {currentPost?.imageCredit || "Not specified"}
                        </span>
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
            <DialogDescription>
              Choose a date and time to publish this post.
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
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleConfirm}>
              Confirm Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

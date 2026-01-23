import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ChevronRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Campaign, Post } from "@shared/schema";

export default function Review() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState("");

  useEffect(() => {
    fetchCampaigns();
    fetchPosts();
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
    }
  }, [selectedPostIndex, posts]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
      
      if (data.length > 0 && data[0].aiPrompt) {
        setPrompt(data[0].aiPrompt);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchPosts = async (campaignId?: number) => {
    try {
      setLoading(true);
      const url = campaignId 
        ? `/api/posts?campaignId=${campaignId}&status=draft` 
        : '/api/posts?status=draft';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
      setSelectedPostIndex(0);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPost = posts[selectedPostIndex];
  const activeCampaign = campaigns.find(c => c.id.toString() === selectedCampaign) || campaigns[0];

  const handleFetchNew = async () => {
    if (!activeCampaign) {
      toast({
        title: "No Campaign Selected",
        description: "Please select a campaign first",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${activeCampaign.id}/fetch`, { 
        method: 'POST' 
      });
      const result = await response.json();
      
      toast({
        title: "Fetch Complete",
        description: result.message,
      });
      
      await fetchPosts(activeCampaign.id);
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedCaption: caption })
      });
      
      if (!response.ok) throw new Error('Failed to save');
      
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

  const handleSchedule = async () => {
    if (!currentPost) return;
    
    try {
      const response = await fetch(`/api/posts/${currentPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'scheduled',
          generatedCaption: caption,
          scheduledFor: new Date(Date.now() + 3600000).toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to schedule');
      
      toast({
        title: "Scheduled",
        description: "Post queued for the next available slot.",
      });
      
      await fetchPosts(activeCampaign?.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule post",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!currentPost) return;
    
    try {
      const response = await fetch(`/api/posts/${currentPost.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'approved',
          generatedCaption: caption
        })
      });
      
      if (!response.ok) throw new Error('Failed to approve');
      
      toast({
        title: "Approved",
        description: "Post approved and ready for publishing.",
      });
      
      await fetchPosts(activeCampaign?.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve post",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = () => {
    toast({
      title: "AI Generation Not Yet Implemented",
      description: "AI caption generation will be available in Phase 2.",
    });
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
               <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                 <SelectTrigger data-testid="select-campaign">
                   <SelectValue placeholder="Select Campaign" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Campaigns</SelectItem>
                   {campaigns.map(campaign => (
                     <SelectItem key={campaign.id} value={campaign.id.toString()}>
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
                   onClick={() => setSelectedPostIndex(Math.max(0, selectedPostIndex - 1))}
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
                   onClick={() => setSelectedPostIndex(Math.min(posts.length - 1, selectedPostIndex + 1))}
                   disabled={selectedPostIndex === posts.length - 1}
                 >
                   <ChevronRight className="h-4 w-4" />
                 </Button>
               </div>
             )}
          </div>
          
          <div className="flex gap-2">
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
              onClick={handleSchedule}
              disabled={!currentPost}
              data-testid="button-schedule"
            >
              <CalendarClock className="h-4 w-4" />
              Schedule
            </Button>
            <Button 
              className="gap-2 shadow-lg shadow-primary/25" 
              onClick={handleApprove}
              disabled={!currentPost}
              data-testid="button-approve"
            >
              <Check className="h-4 w-4" />
              Approve
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
          <p className="text-muted-foreground mb-4">No draft posts to review.</p>
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
                  <Badge variant="secondary">Draft</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto">
                <h3 className="font-bold text-lg mb-1" data-testid="text-source-title">
                  {currentPost?.sourceTitle || "No title"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Source: {currentPost?.sourceUrl ? new URL(currentPost.sourceUrl).hostname : "Unknown"}
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm">
                  <p>{currentPost?.sourceSnippet || "No content available"}</p>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t py-2">
                {currentPost?.sourceUrl && (
                  <a href={currentPost.sourceUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="ghost" size="sm" className="w-full gap-2 h-8 text-xs">
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
                  <Badge variant="outline" className="text-[10px] h-5 bg-primary/5 text-primary border-primary/20">
                    Config: {activeCampaign?.topic || "Default"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Wand2 className="h-3 w-3 text-primary" />
                    System Prompt
                  </Label>
                  <Textarea 
                    value={prompt || activeCampaign?.aiPrompt || "You are a social media content writer. Create an engaging post based on this article."}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[80px] text-xs leading-relaxed resize-y font-mono bg-muted/20"
                    data-testid="textarea-prompt"
                  />
                </div>

                <Button 
                  variant="secondary" 
                  className="w-full gap-2 hover:bg-primary/10 hover:text-primary transition-colors" 
                  onClick={handleRegenerate}
                  data-testid="button-regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate Caption (Phase 2)
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
                     <span>{(caption.match(/#\w+/g) || []).length} hashtags detected</span>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="image" className="flex-1 mt-0">
                <Card className="h-full overflow-hidden flex flex-col">
                  <div className="flex-1 bg-muted/30 relative group flex items-center justify-center">
                    {currentPost?.imageUrl ? (
                      <img 
                        src={currentPost.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No image available</p>
                        <p className="text-xs">Image sourcing will be added in Phase 2</p>
                      </div>
                    )}
                  </div>
                  <CardFooter className="border-t p-4 bg-muted/10">
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Image Credit</span>
                        <span className="text-muted-foreground">
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
    </Layout>
  );
}

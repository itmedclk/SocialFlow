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
  Send
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const MOCK_CAMPAIGNS = [
  { id: "1", name: "Alternative Health Daily", topic: "Health & Wellness" },
  { id: "2", name: "Tech Startup News", topic: "Technology" },
  { id: "3", name: "Motivational Quotes", topic: "Lifestyle" }
];

export default function Review() {
  const { toast } = useToast();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("2");
  const [prompt, setPrompt] = useState("You are a tech journalist. Summarize this news for a LinkedIn audience. Focus on business impact and innovation. Keep it professional but engaging.");
  const [caption, setCaption] = useState(
    "✨ Discover the power of mindfulness in your daily routine.\n\nRecent studies suggest that just 10 minutes a day can significantly reduce stress levels and improve overall well-being. It's not about emptying your mind, but rather observing the present moment without judgment.\n\nStart small today. Take 3 deep breaths right now. 🌿\n\nThis content is for informational purposes only and is not medical advice.\n\n#mindfulness #health #wellness #holistic #stressrelief #meditation #selfcare #mentalhealth"
  );

  const activeCampaign = MOCK_CAMPAIGNS.find(c => c.id === selectedCampaign) || MOCK_CAMPAIGNS[0];

  const handleFetchNew = () => {
    toast({
      title: "Fetching New Content",
      description: `Searching RSS feeds for ${activeCampaign.name} and generating new draft...`,
    });
  };

  const handleRegenerate = () => {
    toast({
      title: "Regenerating Content",
      description: `Request sent to Novita AI model for ${activeCampaign.name} using custom prompt...`,
    });
  };

  const handleSaveDraft = () => {
    toast({
      title: "Draft Saved",
      description: "Content saved to drafts for later review.",
      variant: "default",
    });
  };

  const handlePostNow = () => {
    toast({
      title: "Posting Now",
      description: "Content is being published to configured platforms.",
      variant: "default",
    });
  };

  const handleSchedule = () => {
    toast({
      title: "Scheduled",
      description: "Post queued for the next available slot.",
      variant: "default",
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
                 <SelectTrigger>
                   <SelectValue placeholder="Select Campaign" />
                 </SelectTrigger>
                 <SelectContent>
                   {MOCK_CAMPAIGNS.map(campaign => (
                     <SelectItem key={campaign.id} value={campaign.id}>
                       {campaign.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
             <Button variant="secondary" className="gap-2" onClick={handleFetchNew}>
                <Search className="h-4 w-4" />
                Find New Article
             </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleSaveDraft}>
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleSchedule}>
              <CalendarClock className="h-4 w-4" />
              Schedule
            </Button>
            <Button className="gap-2 shadow-lg shadow-primary/25" onClick={handlePostNow}>
              <Send className="h-4 w-4" />
              Post Now
            </Button>
          </div>
        </div>
      </div>

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
                <Badge variant="secondary">New Arrival</Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <h3 className="font-bold text-lg mb-1">
                New Study Shows Benefits of Mindfulness for Stress Reduction
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Source: HealthNews Daily • 2 hours ago
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-sm">
                <p>
                  A groundbreaking study published in the Journal of Psychology demonstrates that brief mindfulness interventions can lower cortisol levels by up to 25% in high-stress individuals. The research followed 500 participants over a 6-week period...
                </p>
                <p className="mt-2">
                  Key findings indicate that consistency matters more than duration. Even 5-10 minutes of daily practice showed measurable biological markers of stress reduction.
                </p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/20 border-t py-2">
               <Button variant="ghost" size="sm" className="w-full gap-2 h-8 text-xs">
                 View Original Source <ExternalLink className="h-3 w-3" />
               </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3 py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Generation Controls
                </CardTitle>
                <Badge variant="outline" className="text-[10px] h-5 bg-primary/5 text-primary border-primary/20">
                  Config: {activeCampaign.topic}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-2">
                   <Label className="text-xs">Model Override</Label>
                   <select 
                     className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                     onChange={(e) => {
                       const input = document.getElementById('model-override-input');
                       if (input) {
                         if (e.target.value === 'custom') {
                           input.removeAttribute('disabled');
                           input.focus();
                         } else {
                           input.setAttribute('disabled', 'true');
                         }
                       }
                     }}
                   >
                     <option value="default">Use Default (Configured in Settings)</option>
                     <option value="custom">Override (Enter Model ID below)</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <Label className="text-xs">Tone / Style</Label>
                   <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
                     <option>Informative & Calm</option>
                     <option>Excited & Urgent</option>
                     <option>Professional & Clinical</option>
                     <option>Empathetic & Supportive</option>
                   </select>
                 </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Model Name / ID</Label>
                <Input 
                  id="model-override-input"
                  placeholder="e.g. deepseek/deepseek-v3.2" 
                  className="h-9 text-sm disabled:opacity-50 disabled:bg-muted/50" 
                  disabled
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs flex items-center gap-1.5">
                  <Wand2 className="h-3 w-3 text-primary" />
                  System Prompt
                </Label>
                <Textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px] text-xs leading-relaxed resize-y font-mono bg-muted/20"
                />
              </div>

              <Button variant="secondary" className="w-full gap-2 hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleRegenerate}>
                <RefreshCw className="h-4 w-4" />
                Regenerate Caption
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
                 AI Generated Draft
               </div>
            </div>

            <TabsContent value="caption" className="flex-1 mt-0">
              <Card className="h-full flex flex-col">
                <CardContent className="flex-1 p-0">
                   <Textarea 
                     value={caption}
                     onChange={(e) => setCaption(e.target.value)}
                     className="h-full w-full resize-none border-0 focus-visible:ring-0 p-6 text-base leading-relaxed font-sans"
                   />
                </CardContent>
                <CardFooter className="border-t bg-muted/10 py-2 px-4 flex justify-between items-center text-xs text-muted-foreground">
                   <span>{caption.length} / 2200 characters</span>
                   <span>12 hashtags detected</span>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="image" className="flex-1 mt-0">
              <Card className="h-full overflow-hidden flex flex-col">
                <div className="flex-1 bg-muted/30 relative group">
                  <img 
                    src="/sample-post.jpg" 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <Button variant="secondary">Change Image</Button>
                  </div>
                </div>
                <CardFooter className="border-t p-4 bg-muted/10">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Image Credit</span>
                      <span className="text-muted-foreground">Unsplash / Sarah Smith</span>
                    </div>
                    <div className="flex justify-between text-xs">
                       <span className="font-medium">License</span>
                       <span className="text-emerald-600">Commercial Safe</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
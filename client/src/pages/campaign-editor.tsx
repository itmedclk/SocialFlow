import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Save, Globe, Key, ShieldAlert, Clock, Plus, Trash2, ArrowLeft, Layers, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";

export default function CampaignEditor() {
  const [location, setLocation] = useLocation();
  const [showKeys, setShowKeys] = useState<Record<string, any>>({});
  const [rssUrls, setRssUrls] = useState<string[]>([
    "https://news.google.com/rss/search?q=technology&hl=en-US&gl=US&ceid=US:en"
  ]);
  const [imageSources, setImageSources] = useState<{type: string, value: string}[]>([
    { type: "unsplash", value: "technology, startup, business" }
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter", "linkedin"]);
  const { toast } = useToast();

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addRssUrl = () => {
    setRssUrls([...rssUrls, ""]);
  };

  const removeRssUrl = (index: number) => {
    const newUrls = [...rssUrls];
    newUrls.splice(index, 1);
    setRssUrls(newUrls);
  };

  const updateRssUrl = (index: number, value: string) => {
    const newUrls = [...rssUrls];
    newUrls[index] = value;
    setRssUrls(newUrls);
  };

  const addImageSource = () => {
    setImageSources([...imageSources, { type: "unsplash", value: "" }]);
  };

  const removeImageSource = (index: number) => {
    const newSources = [...imageSources];
    newSources.splice(index, 1);
    setImageSources(newSources);
  };

  const updateImageSource = (index: number, field: 'type' | 'value', value: string) => {
    const newSources = [...imageSources];
    newSources[index] = { ...newSources[index], [field]: value };
    setImageSources(newSources);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSave = () => {
    toast({
      title: "Campaign Saved",
      description: "Automation rules updated successfully.",
      variant: "default",
    });
    setLocation("/campaigns");
  };

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
            <h1 className="text-3xl font-bold tracking-tight">Configure Campaign</h1>
            <p className="text-muted-foreground mt-1">
              Edit settings for "Tech Startup News"
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
                  <Layers className="h-5 w-5 text-primary" />
                  <CardTitle>Campaign Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Campaign Name</Label>
                    <Input defaultValue="Tech Startup News" />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic / Category</Label>
                    <Input defaultValue="Technology" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Automation Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <CardTitle>Schedule</CardTitle>
                </div>
                <CardDescription>When should this specific campaign run?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="hourly">Hourly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Run Time</Label>
                    <Input type="time" defaultValue="08:00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="pst">Pacific Time</option>
                      <option value="est" selected>Eastern Time</option>
                      <option value="utc">UTC</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RSS Source */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <CardTitle>Content Sources</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>RSS Feed URLs</Label>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={addRssUrl}>
                      <Plus className="h-3 w-3" /> Add Source
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {rssUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-2.5 text-xs font-mono text-muted-foreground">#{index + 1}</span>
                          <Input 
                            value={url}
                            onChange={(e) => updateRssUrl(index, e.target.value)}
                            className="font-mono text-xs pl-8"
                          />
                        </div>
                        {rssUrls.length > 1 && (
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeRssUrl(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image Sources */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Image Source Override</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Specific Keyword Overrides</Label>
                    <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs" onClick={addImageSource}>
                      <Plus className="h-3 w-3" /> Add Keyword
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {imageSources.map((source, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="w-[140px]">
                           <select 
                             className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                             value={source.type}
                             onChange={(e) => updateImageSource(index, 'type', e.target.value)}
                           >
                             <option value="unsplash">Unsplash</option>
                             <option value="pexels">Pexels</option>
                             <option value="wikimedia">Wikimedia</option>
                             <option value="google">Google Images</option>
                           </select>
                        </div>
                        <div className="relative flex-1">
                          <Input 
                            value={source.value}
                            onChange={(e) => updateImageSource(index, 'value', e.target.value)}
                            placeholder="Force search for specific keywords (e.g. nature)"
                            className="text-sm"
                          />
                        </div>
                        {imageSources.length > 1 && (
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeImageSource(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    System will default to dynamic AI search using global sources. Use these overrides only if specific keywords are required for this topic.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Configuration Override */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>AI & Generation Settings</CardTitle>
                </div>
                <CardDescription>Override global AI settings for this campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border p-3 rounded-md bg-muted/10">
                   <div className="space-y-0.5">
                     <Label className="text-sm">Use Global AI Keys</Label>
                     <p className="text-[10px] text-muted-foreground">Disable to set a custom model/key for this topic.</p>
                   </div>
                   <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label>System Prompt Template</Label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue="You are a tech journalist. Summarize this news for a LinkedIn audience. Focus on business impact and innovation. Keep it professional but engaging."
                  />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar Config Column */}
          <div className="space-y-6">
            
            {/* Save Actions */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 space-y-3">
                <Button className="w-full gap-2 shadow-md" size="lg" onClick={handleSave}>
                  <Save className="h-4 w-4" /> Save Campaign
                </Button>
                <div className="flex items-center justify-between px-2">
                  <Label className="cursor-pointer">Active</Label>
                  <Switch defaultChecked />
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
                    { id: "telegram", label: "Telegram" }
                  ].map((platform) => (
                    <div 
                      key={platform.id}
                      className={`
                        flex items-center space-x-3 border rounded-md p-3 cursor-pointer transition-colors
                        ${selectedPlatforms.includes(platform.id) 
                          ? "bg-primary/10 border-primary" 
                          : "hover:bg-muted/50 border-input"}
                      `}
                      onClick={() => togglePlatform(platform.id)}
                    >
                      <Checkbox 
                        id={platform.id} 
                        checked={selectedPlatforms.includes(platform.id)}
                        onCheckedChange={() => togglePlatform(platform.id)}
                        className="pointer-events-none" 
                      />
                      <label className="text-sm font-medium cursor-pointer pointer-events-none">
                        {platform.label}
                      </label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Safety Constraints */}
            <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/10">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                  <ShieldAlert className="h-4 w-4" /> Safety
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Forbidden Terms</Label>
                  <Input className="h-8 text-xs" defaultValue="scam, hack, crypto" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Length</Label>
                  <Input type="number" className="h-8 text-xs" defaultValue={2000} />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
}
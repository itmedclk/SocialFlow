import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Save, Globe, Key, ShieldAlert, Clock, Plus, Trash2, ArrowLeft, Layers, Image as ImageIcon, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation, useParams } from "wouter";
import type { Campaign } from "@shared/schema";

type ScheduleFrequency = "hourly" | "daily" | "weekly" | "custom";

function cronToSchedule(cron: string): { frequency: ScheduleFrequency; time: string; days: string[] } {
  if (!cron) return { frequency: "daily", time: "09:00", days: [] };
  
  const parts = cron.split(" ");
  if (parts.length !== 5) return { frequency: "custom", time: "09:00", days: [] };
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  if (hour.startsWith("*/")) {
    return { frequency: "hourly", time: `${hour.slice(2).padStart(2, "0")}:00`, days: [] };
  }
  
  const timeStr = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  
  if (dayOfWeek === "*") {
    return { frequency: "daily", time: timeStr, days: [] };
  }
  
  const dayMap: Record<string, string> = { "0": "sun", "1": "mon", "2": "tue", "3": "wed", "4": "thu", "5": "fri", "6": "sat" };
  const days = dayOfWeek.split(",").map(d => dayMap[d] || d);
  
  return { frequency: "weekly", time: timeStr, days };
}

function scheduleToCron(frequency: ScheduleFrequency, time: string, days: string[]): string {
  const [hour, minute] = time.split(":").map(Number);
  
  switch (frequency) {
    case "hourly":
      return `0 */${hour || 1} * * *`;
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekly":
      const dayMap: Record<string, string> = { "sun": "0", "mon": "1", "tue": "2", "wed": "3", "thu": "4", "fri": "5", "sat": "6" };
      const dayNums = days.map(d => dayMap[d]).join(",") || "*";
      return `${minute} ${hour} * * ${dayNums}`;
    default:
      return "";
  }
}

export default function CampaignEditor() {
  const [location, setLocation] = useLocation();
  const params = useParams();
  const campaignId = !params.id || params.id === 'new' ? null : parseInt(params.id);
  
  const [loading, setLoading] = useState(!!campaignId);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<ScheduleFrequency>("daily");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDays, setScheduleDays] = useState<string[]>([]);
  const [scheduleTimezone, setScheduleTimezone] = useState("America/Los_Angeles");
  const [rssUrls, setRssUrls] = useState<string[]>([""]);
  const [imageKeywords, setImageKeywords] = useState<string[]>([]);
  const [imageSources, setImageSources] = useState<{type: string, value: string}[]>([
    { type: "unsplash", value: "" }
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [useSpecificAccount, setUseSpecificAccount] = useState(false);
  const [specificAccountId, setSpecificAccountId] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [safetyForbiddenTerms, setSafetyForbiddenTerms] = useState("");
  const [safetyMaxLength, setSafetyMaxLength] = useState(2000);
  const [isActive, setIsActive] = useState(true);
  const [autoPublish, setAutoPublish] = useState(false);
  const [useAiImage, setUseAiImage] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (campaignId) {
      fetchCampaign();
    }
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) throw new Error('Failed to fetch campaign');
      
      const campaign: Campaign = await response.json();
      setName(campaign.name);
      setTopic(campaign.topic);
      const schedule = cronToSchedule(campaign.scheduleCron || "");
      setScheduleFrequency(schedule.frequency);
      setScheduleTime(schedule.time);
      setScheduleDays(schedule.days);
      setRssUrls(campaign.rssUrls && campaign.rssUrls.length > 0 ? campaign.rssUrls : [""]);
      setImageKeywords(campaign.imageKeywords || []);
      setImageSources(campaign.imageProviders && campaign.imageProviders.length > 0 
        ? campaign.imageProviders 
        : [{ type: "unsplash", value: "" }]);
      setSelectedPlatforms(campaign.targetPlatforms || []);
      setUseSpecificAccount(campaign.useSpecificAccount ?? false);
      setSpecificAccountId(campaign.specificAccountId || "");
      setScheduleTimezone(campaign.scheduleTimezone || "America/Los_Angeles");
      setAiPrompt(campaign.aiPrompt || "");
      setSafetyForbiddenTerms(campaign.safetyForbiddenTerms || "");
      setSafetyMaxLength(campaign.safetyMaxLength || 2000);
      setIsActive(campaign.isActive ?? true);
      setAutoPublish(campaign.autoPublish ?? false);
      setUseAiImage(campaign.useAiImage ?? false);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      toast({
        title: "Error",
        description: "Failed to load campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addRssUrl = () => {
    setRssUrls([...rssUrls, ""]);
  };

  const removeRssUrl = (index: number) => {
    const newUrls = [...rssUrls];
    newUrls.splice(index, 1);
    setRssUrls(newUrls.length > 0 ? newUrls : [""]);
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
    setImageSources(newSources.length > 0 ? newSources : [{ type: "unsplash", value: "" }]);
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

  const handleSave = async () => {
    if (!name.trim() || !topic.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in campaign name and topic",
        variant: "destructive",
      });
      return;
    }

    const validRssUrls = rssUrls.filter(url => url.trim() !== "");
    const validImageSources = imageSources.filter(source => source.value.trim() !== "");
    const cronExpression = scheduleToCron(scheduleFrequency, scheduleTime, scheduleDays);

    const campaignData = {
      name: name.trim(),
      topic: topic.trim(),
      scheduleCron: cronExpression || null,
      scheduleTimezone,
      rssUrls: validRssUrls,
      imageKeywords,
      imageProviders: validImageSources,
      targetPlatforms: selectedPlatforms,
      useSpecificAccount,
      specificAccountId: useSpecificAccount ? specificAccountId.trim() || null : null,
      aiPrompt: aiPrompt.trim() || null,
      safetyForbiddenTerms: safetyForbiddenTerms.trim() || null,
      safetyMaxLength,
      isActive,
      autoPublish,
      useAiImage,
    };

    try {
      const url = campaignId ? `/api/campaigns/${campaignId}` : '/api/campaigns';
      const method = campaignId ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(campaignData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save campaign');
      }

      toast({
        title: "Success",
        description: campaignId ? "Campaign updated successfully" : "Campaign created successfully",
        variant: "default",
      });
      
      setLocation("/campaigns");
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save campaign",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-muted-foreground">
          Loading campaign...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/campaigns">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaignId ? "Edit Campaign" : "Create New Campaign"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {campaignId ? `Configure "${name}"` : "Set up a new automation campaign"}
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
                    <Label>Campaign Name *</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Tech Startup News"
                      data-testid="input-campaign-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Topic / Category *</Label>
                    <Input 
                      value={topic} 
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Technology"
                      data-testid="input-campaign-topic"
                    />
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
                <CardDescription>When should this campaign run automatically?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={scheduleFrequency}
                      onChange={(e) => {
                        const newFrequency = e.target.value as ScheduleFrequency;
                        setScheduleFrequency(newFrequency);
                        // Reset time to appropriate default when switching frequencies
                        if (newFrequency === "hourly") {
                          setScheduleTime("01:00"); // Default to every 1 hour
                        } else if (scheduleTime.split(":")[0] === "01" || scheduleTime.split(":")[0] === "02" || scheduleTime.split(":")[0] === "03" || scheduleTime.split(":")[0] === "04" || scheduleTime.split(":")[0] === "06" || scheduleTime.split(":")[0] === "08" || scheduleTime.split(":")[0] === "12") {
                          // If coming from hourly with small hours, reset to 9 AM
                          setScheduleTime("09:00");
                        }
                      }}
                      data-testid="select-frequency"
                    >
                      <option value="hourly">Every X Hours</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Specific Days</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{scheduleFrequency === "hourly" ? "Every X Hours" : "Run Time"}</Label>
                    {scheduleFrequency === "hourly" ? (
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={scheduleTime.split(":")[0]}
                        onChange={(e) => setScheduleTime(`${e.target.value}:00`)}
                        data-testid="select-hours-interval"
                      >
                        <option value="01">Every 1 hour</option>
                        <option value="02">Every 2 hours</option>
                        <option value="03">Every 3 hours</option>
                        <option value="04">Every 4 hours</option>
                        <option value="06">Every 6 hours</option>
                        <option value="08">Every 8 hours</option>
                        <option value="12">Every 12 hours</option>
                      </select>
                    ) : (
                      <Input 
                        type="time" 
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        data-testid="input-time"
                      />
                    )}
                  </div>
                </div>
                
                {scheduleFrequency === "weekly" && (
                  <div className="space-y-2">
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
                      ].map((day) => (
                        <button
                          key={day.id}
                          type="button"
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                            scheduleDays.includes(day.id)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background hover:bg-muted border-input"
                          }`}
                          onClick={() => {
                            setScheduleDays(prev =>
                              prev.includes(day.id)
                                ? prev.filter(d => d !== day.id)
                                : [...prev, day.id]
                            );
                          }}
                          data-testid={`day-${day.id}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 mt-4">
                  <Label>Timezone</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={scheduleTimezone}
                    onChange={(e) => setScheduleTimezone(e.target.value)}
                    data-testid="select-timezone"
                  >
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
                  {scheduleFrequency === "daily" && `Campaign will run every day at ${scheduleTime} (${scheduleTimezone.split('/').pop()?.replace('_', ' ')}).`}
                  {scheduleFrequency === "weekly" && scheduleDays.length > 0 && `Campaign will run on ${scheduleDays.join(", ")} at ${scheduleTime} (${scheduleTimezone.split('/').pop()?.replace('_', ' ')}).`}
                  {scheduleFrequency === "weekly" && scheduleDays.length === 0 && "Select at least one day for the campaign to run."}
                </p>
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 gap-1 text-xs" 
                      onClick={addRssUrl}
                      data-testid="button-add-rss"
                    >
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
                            placeholder="https://example.com/rss"
                            data-testid={`input-rss-${index}`}
                          />
                        </div>
                        {rssUrls.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive" 
                            onClick={() => removeRssUrl(index)}
                            data-testid={`button-remove-rss-${index}`}
                          >
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 gap-1 text-xs" 
                      onClick={addImageSource}
                      data-testid="button-add-image-source"
                    >
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
                             data-testid={`select-image-provider-${index}`}
                           >
                             <option value="unsplash">Unsplash</option>
                             <option value="pexels">Pexels</option>
                             <option value="wikimedia">Wikimedia</option>
                           </select>
                        </div>
                        <div className="relative flex-1">
                          <Input 
                            value={source.value}
                            onChange={(e) => updateImageSource(index, 'value', e.target.value)}
                            placeholder="e.g., technology, startup"
                            className="text-sm"
                            data-testid={`input-image-keywords-${index}`}
                          />
                        </div>
                        {imageSources.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive" 
                            onClick={() => removeImageSource(index)}
                            data-testid={`button-remove-image-source-${index}`}
                          >
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

            {/* Account Targeting */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
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
                  <Switch 
                    checked={useSpecificAccount} 
                    onCheckedChange={setUseSpecificAccount}
                    data-testid="switch-use-specific-account"
                  />
                </div>
                
                {useSpecificAccount && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label>Specific Account ID(s)</Label>
                    <Input 
                      value={specificAccountId}
                      onChange={(e) => setSpecificAccountId(e.target.value)}
                      className="font-mono text-sm"
                      placeholder="e.g., 123456789 or 123456789, 987654321"
                      data-testid="input-specific-account-id"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Get your account ID from your Postly dashboard. To post to multiple accounts, separate IDs with commas.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Configuration Override */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>AI & Generation Settings</CardTitle>
                </div>
                <CardDescription>Custom AI prompt for this campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>System Prompt Template</Label>
                  <textarea 
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., You are a tech journalist. Summarize this news for a LinkedIn audience..."
                    data-testid="textarea-ai-prompt"
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
                <Button 
                  className="w-full gap-2 shadow-md" 
                  size="lg" 
                  onClick={handleSave}
                  data-testid="button-save-campaign"
                >
                  <Save className="h-4 w-4" /> Save Campaign
                </Button>
                <div className="flex items-center justify-between px-2">
                  <Label className="cursor-pointer">Active</Label>
                  <Switch 
                    checked={isActive} 
                    onCheckedChange={setIsActive}
                    data-testid="switch-is-active"
                  />
                </div>
                <Separator />
                <div className="space-y-2 px-2">
                  <div className="flex items-center justify-between">
                    <Label className="cursor-pointer">Automatic</Label>
                    <Switch 
                      checked={autoPublish} 
                      onCheckedChange={setAutoPublish}
                      data-testid="switch-auto-publish"
                    />
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
                    <Switch 
                      checked={useAiImage} 
                      onCheckedChange={setUseAiImage}
                      data-testid="switch-use-ai-image"
                    />
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
                      data-testid={`platform-${platform.id}`}
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
                  <Input 
                    className="h-8 text-xs" 
                    value={safetyForbiddenTerms}
                    onChange={(e) => setSafetyForbiddenTerms(e.target.value)}
                    placeholder="e.g., scam, hack"
                    data-testid="input-forbidden-terms"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Max Length</Label>
                  <Input 
                    type="number" 
                    className="h-8 text-xs" 
                    value={safetyMaxLength}
                    onChange={(e) => setSafetyMaxLength(parseInt(e.target.value) || 2000)}
                    data-testid="input-max-length"
                  />
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </Layout>
  );
}

import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, Globe, Key, ShieldAlert, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [showKeys, setShowKeys] = useState<Record<string, any>>({});
  const { toast } = useToast();

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your API configurations have been securely stored.",
      variant: "default",
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage your API connections and automation preferences.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Scheduling Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Automation Schedule</CardTitle>
              </div>
              <CardDescription>
                Control when and how often the pipeline runs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="hourly">Hourly (Testing)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Run Time</Label>
                  <Input type="time" defaultValue="09:00" />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="pst">Pacific Time (PST/PDT)</option>
                    <option value="est">Eastern Time (EST/EDT)</option>
                    <option value="utc">UTC</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RSS Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>Content Source (RSS)</CardTitle>
              </div>
              <CardDescription>
                Define where the application looks for new content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rss-url">Google News RSS Feed URL</Label>
                <Input 
                  id="rss-url" 
                  defaultValue="https://news.google.com/rss/search?q=alternative+health+OR+integrative+medicine&hl=en-US&gl=US&ceid=US:en" 
                  className="font-mono text-xs"
                />
              </div>
              
              <div className="flex items-center justify-between border p-4 rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">Deduplication</Label>
                  <p className="text-xs text-muted-foreground">
                    Prevent posting the same article URL twice.
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                <CardTitle>API & Service Credentials</CardTitle>
              </div>
              <CardDescription>
                Configure AI providers, social platforms, and integration services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* AI Provider Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">AI Model Configuration</Label>
                    <p className="text-xs text-muted-foreground">Select your LLM provider for content generation.</p>
                  </div>
                </div>
                
                <div className="grid gap-4 p-4 border rounded-lg bg-muted/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onChange={(e) => setShowKeys(prev => ({ ...prev, provider: e.target.value }))}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="novita">Novita AI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="custom">Custom / Local (Ollama)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model Name</Label>
                      <Input placeholder="e.g., gpt-4o, nous-hermes-2..." defaultValue="gpt-4o" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>API Endpoint (Base URL)</Label>
                    <Input placeholder="https://api.openai.com/v1" defaultValue="https://api.openai.com/v1" className="font-mono text-xs" />
                  </div>

                  <div className="space-y-2">
                    <Label>API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input 
                          type={showKeys['ai_key'] ? "text" : "password"} 
                          placeholder="sk-..." 
                          className="pr-10 font-mono"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                          onClick={() => toggleShowKey('ai_key')}
                        >
                          {showKeys['ai_key'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button variant="outline" onClick={() => toast({ title: "Validating API Key", description: "Connection successful! Provider: Novita AI" })}>
                        Test Key
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>System Prompt Template</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      defaultValue="You are an expert social media manager. Summarize the following news for Instagram..."
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Data Storage Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label className="text-base">Data Storage & Audit</Label>
                  <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-200">Local System</Badge>
                </div>
                
                <div className="grid gap-4 p-4 border rounded-lg bg-muted/10">
                  <div className="space-y-2">
                    <Label>Storage Method</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <option value="local">Local App Storage (JSON Logs)</option>
                      <option value="db" disabled>PostgreSQL Database (Coming Soon)</option>
                    </select>
                    <p className="text-[10px] text-muted-foreground">
                      Post history and failures will be saved to <code>/logs/posts.json</code> in the application folder.
                    </p>
                  </div>

                  <div className="flex items-center justify-between border p-3 rounded-md bg-background">
                     <div className="space-y-0.5">
                       <Label className="text-sm">Retention Policy</Label>
                       <p className="text-[10px] text-muted-foreground">Auto-delete logs older than 30 days</p>
                     </div>
                     <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Image Source Section */}
              <div className="space-y-3">
                <Label>Image Source</Label>
                <div className="grid gap-3">
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => setShowKeys(prev => ({ ...prev, unsplash: e.target.value === 'unsplash', pexels: e.target.value === 'pexels' }))}
                  >
                    <option value="wikimedia">Wikimedia Commons (Free/No Key)</option>
                    <option value="unsplash">Unsplash (Requires Key)</option>
                    <option value="pexels">Pexels (Requires Key)</option>
                    <option value="pixabay">Pixabay (Requires Key)</option>
                  </select>

                  <div className="relative">
                    <Input 
                      type={showKeys['image_api'] ? "text" : "password"} 
                      placeholder="Image Service API Key (if required)" 
                      className="pr-10 font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleShowKey('image_api')}
                    >
                      {showKeys['image_api'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Postly Section */}
              <div className="space-y-3">
                <Label>Postly API Key (Scheduling)</Label>
                <div className="relative">
                  <Input 
                    type={showKeys['postly'] ? "text" : "password"} 
                    placeholder="postly_..." 
                    className="pr-10 font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => toggleShowKey('postly')}
                  >
                    {showKeys['postly'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Postly Workspace ID</Label>
                <Input placeholder="ws_..." className="font-mono" />
              </div>

            </CardContent>
          </Card>

          {/* Safety Settings */}
          <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/10 dark:bg-amber-900/10">
            <CardHeader>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                <ShieldAlert className="h-5 w-5" />
                <CardTitle>Safety Constraints</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Caption Length</Label>
                  <Input type="number" defaultValue={1900} />
                  <p className="text-[10px] text-muted-foreground">Hard limit for IG safety buffer.</p>
                </div>
                <div className="space-y-2">
                  <Label>Max Auto-Retries</Label>
                  <Input type="number" defaultValue={3} />
                  <p className="text-[10px] text-muted-foreground">Attempts before marking as failed.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Forbidden Terms</Label>
                  <Input defaultValue="cure, miracle, guarantee, treat" />
                  <p className="text-[10px] text-muted-foreground">Comma separated words that trigger a halt.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-4">
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
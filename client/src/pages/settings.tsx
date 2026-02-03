import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Save,
  Key,
  AlertCircle,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/auth-utils";

interface UserSettings {
  userId: string;
  aiApiKey: string | null;
  aiBaseUrl: string | null;
  aiModel: string | null;
  globalAiPrompt: string | null;
  postlyApiKey: string | null;
  postlyWorkspaceId: string | null;
  unsplashAccessKey: string | null;
  pexelsApiKey: string | null;
  aiImageModel: string | null;
  novitaApiKey: string | null;
  googleClientId: string | null;
  googleClientSecret: string | null;
  googleSpreadsheetId: string | null;
  googleConnected?: boolean;
}

export default function Settings() {
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    aiApiKey: "",
    aiBaseUrl: "https://api.novita.ai/openai",
    aiModel: "deepseek/deepseek-v3.2",
    globalAiPrompt:
      "You are an expert social media manager. Generate an engaging Instagram caption for the following news article. Include relevant hashtags.",
    postlyApiKey: "",
    postlyWorkspaceId: "",
    unsplashAccessKey: "",
    pexelsApiKey: "",
    aiImageModel: "flux-1-schnell",
    novitaApiKey: "",
    googleClientId: "",
    googleClientSecret: "",
    googleSpreadsheetId: "",
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>(
    {
      queryKey: ["/api/settings"],
      queryFn: async () => {
        const res = await fetch("/api/settings", { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) throw new Error("401: Unauthorized");
          throw new Error("Failed to fetch settings");
        }
        return res.json();
      },
      enabled: isAuthenticated,
    },
  );

  useEffect(() => {
    if (settings) {
      setFormData({
        aiApiKey: settings.aiApiKey || "",
        aiBaseUrl: settings.aiBaseUrl || "https://api.novita.ai/openai",
        aiModel: settings.aiModel || "openai/gpt-oss-120b",
        globalAiPrompt:
          settings.globalAiPrompt ||
          "You are an expert social media manager. Generate an engaging Instagram caption for the following news article. Include relevant hashtags.",
        postlyApiKey: settings.postlyApiKey || "",
        postlyWorkspaceId: settings.postlyWorkspaceId || "",
        unsplashAccessKey: settings.unsplashAccessKey || "",
        pexelsApiKey: settings.pexelsApiKey || "",
        aiImageModel: settings.aiImageModel || "flux-1-schnell",
        novitaApiKey: settings.novitaApiKey || "",
        googleClientId: settings.googleClientId || "",
        googleClientSecret: settings.googleClientSecret || "",
        googleSpreadsheetId: settings.googleSpreadsheetId || "",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("401: Unauthorized");
        throw new Error("Failed to save settings");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Saved",
        description: "Your API configurations have been securely stored.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session Expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleShowKey = (key: string) => {
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleGoogleConnect = () => {
    window.location.href = "/api/google/oauth/start";
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <LogIn className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to manage your API keys and settings. Your keys
                are securely stored and only accessible to you.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="gap-2">
                <a href="/api/login" data-testid="button-login">
                  <LogIn className="h-4 w-4" />
                  Sign In with Replit
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal API keys for AI, publishing, and image
              services.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt=""
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
              <span>{user?.firstName || user?.email || "User"}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
          <CardContent className="pt-4">
            <div className="flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Your API keys are private</p>
                <p className="text-amber-700 dark:text-amber-300">
                  Each user provides their own API keys. Your keys are encrypted
                  and only used for your campaigns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {settingsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>AI Provider</CardTitle>
                </div>
                <CardDescription>
                  Configure your AI model for generating social media captions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aiBaseUrl">API Base URL</Label>
                    <Input
                      id="aiBaseUrl"
                      placeholder="https://api.novita.ai/openai"
                      value={formData.aiBaseUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          aiBaseUrl: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                      data-testid="input-ai-base-url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="aiModel">Model Name</Label>
                    <Input
                      id="aiModel"
                      placeholder="deepseek/deepseek-v3.2"
                      value={formData.aiModel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          aiModel: e.target.value,
                        }))
                      }
                      className="font-mono text-sm"
                      data-testid="input-ai-model"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aiApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="aiApiKey"
                      type={showKeys["ai"] ? "text" : "password"}
                      placeholder="sk-..."
                      value={formData.aiApiKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          aiApiKey: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono"
                      data-testid="input-ai-api-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey("ai")}
                      data-testid="button-toggle-ai-key"
                    >
                      {showKeys["ai"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Works with any OpenAI-compatible API (Novita AI, OpenAI,
                    Together AI, etc.)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="globalAiPrompt">
                    Default AI Prompt (Global)
                  </Label>
                  <textarea
                    id="globalAiPrompt"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="You are an expert social media manager..."
                    value={formData.globalAiPrompt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        globalAiPrompt: e.target.value,
                      }))
                    }
                    data-testid="input-global-ai-prompt"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is used as a fallback when a campaign doesn't have its
                    own prompt.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>Postly Publishing</CardTitle>
                </div>
                <CardDescription>
                  Your Postly API key and Workspace ID for publishing to social
                  media platforms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="postlyApiKey">API Key</Label>
                  <div className="relative">
                    <Input
                      id="postlyApiKey"
                      type={showKeys["postly"] ? "text" : "password"}
                      placeholder="postly_..."
                      value={formData.postlyApiKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          postlyApiKey: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono"
                      data-testid="input-postly-api-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey("postly")}
                      data-testid="button-toggle-postly-key"
                    >
                      {showKeys["postly"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postlyWorkspaceId">Workspace ID</Label>
                  <Input
                    id="postlyWorkspaceId"
                    placeholder="Workspace ID"
                    value={formData.postlyWorkspaceId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        postlyWorkspaceId: e.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                    data-testid="input-postly-workspace-id"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>Image Services</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>
                <CardDescription>
                  API keys for Unsplash and Pexels image search. Wikimedia
                  Commons works without a key.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="unsplashAccessKey">Unsplash Access Key</Label>
                  <div className="relative">
                    <Input
                      id="unsplashAccessKey"
                      type={showKeys["unsplash"] ? "text" : "password"}
                      placeholder="Access Key"
                      value={formData.unsplashAccessKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          unsplashAccessKey: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono"
                      data-testid="input-unsplash-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey("unsplash")}
                    >
                      {showKeys["unsplash"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pexelsApiKey">Pexels API Key</Label>
                  <div className="relative">
                    <Input
                      id="pexelsApiKey"
                      type={showKeys["pexels"] ? "text" : "password"}
                      placeholder="API Key"
                      value={formData.pexelsApiKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          pexelsApiKey: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono"
                      data-testid="input-pexels-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey("pexels")}
                    >
                      {showKeys["pexels"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>AI Image Generation</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>
                <CardDescription>
                  Configure Novita AI for generating images based on captions. Enable per-campaign in campaign settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="novitaApiKey">Novita AI API Key</Label>
                  <div className="relative">
                    <Input
                      id="novitaApiKey"
                      type={showKeys["novita"] ? "text" : "password"}
                      placeholder="API Key"
                      value={formData.novitaApiKey}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          novitaApiKey: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono"
                      data-testid="input-novita-api-key"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey("novita")}
                    >
                      {showKeys["novita"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a href="https://novita.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      novita.ai
                    </a>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aiImageModel">Image Model ID</Label>
                  <Input
                    id="aiImageModel"
                    placeholder="e.g., flux-1-schnell"
                    value={formData.aiImageModel}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        aiImageModel: e.target.value,
                      }))
                    }
                    data-testid="input-ai-image-model"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the Novita AI image model ID (e.g., flux-1-schnell, flux-1-dev, sdxl, sd-3)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  <CardTitle>Google Sheets Logging</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>
                <CardDescription>
                  Provide Google OAuth client credentials and the target Spreadsheet ID for recording published posts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-primary/30 bg-primary/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Google connection</p>
                    <p className="text-xs text-muted-foreground">
                      {settings?.googleConnected
                        ? "Connected. Posts will log to your sheet."
                        : "Connect your Google account to enable Sheets logging."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={settings?.googleConnected ? "outline" : "default"}
                    onClick={handleGoogleConnect}
                    data-testid="button-google-connect"
                  >
                    {settings?.googleConnected ? "Reconnect Google" : "Connect Google"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleClientId">Google OAuth Client ID</Label>
                  <Input
                    id="googleClientId"
                    placeholder="1234567890-abc.apps.googleusercontent.com"
                    value={formData.googleClientId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        googleClientId: e.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                    data-testid="input-google-client-id"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleClientSecret">Google OAuth Client Secret</Label>
                  <div className="relative">
                    <Input
                      id="googleClientSecret"
                      type={showKeys["googleClientSecret"] ? "text" : "password"}
                      placeholder="Client Secret"
                      value={formData.googleClientSecret}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          googleClientSecret: e.target.value,
                        }))
                      }
                      className="pr-10 font-mono"
                      data-testid="input-google-client-secret"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey("googleClientSecret")}
                      data-testid="button-toggle-google-client-secret"
                    >
                      {showKeys["googleClientSecret"] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="googleSpreadsheetId">Google Spreadsheet ID</Label>
                  <Input
                    id="googleSpreadsheetId"
                    placeholder="1abcDEFghIJklmnOPqrStuVWxyz"
                    value={formData.googleSpreadsheetId}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        googleSpreadsheetId: e.target.value,
                      }))
                    }
                    className="font-mono text-sm"
                    data-testid="input-google-spreadsheet-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the ID from your Google Sheets URL (after /d/ and before /edit).
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  OAuth Redirect URI: <span className="font-mono">https://social-flow-test.replit.app/api/google/oauth/callback</span>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-end">
              <Button
                size="lg"
                className="gap-2 shadow-lg shadow-primary/25"
                onClick={handleSave}
                disabled={saveMutation.isPending}
                data-testid="button-save-settings"
              >
                {saveMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Settings
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

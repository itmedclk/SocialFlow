import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Settings2, Clock, Trash2, Edit, ExternalLink, Calendar, Globe } from "lucide-react";
import { Link } from "wouter";
import { useEffect, useState } from "react";
import type { Campaign } from "@shared/schema";

function formatSchedule(cron: string | null): string {
  if (!cron) return "No schedule set";
  
  const parts = cron.split(" ");
  if (parts.length !== 5) return cron;
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
  if (hour.startsWith("*/")) {
    const interval = hour.slice(2);
    return `Every ${interval} hour${interval === "1" ? "" : "s"}`;
  }
  
  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
  
  if (dayOfWeek === "*") {
    return `Daily at ${time}`;
  }
  
  const dayMap: Record<string, string> = { 
    "0": "Sun", "1": "Mon", "2": "Tue", "3": "Wed", 
    "4": "Thu", "5": "Fri", "6": "Sat" 
  };
  const days = dayOfWeek.split(",").map(d => dayMap[d] || d).join(", ");
  
  return `${days} at ${time}`;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !campaign.isActive })
      });
      
      if (!response.ok) throw new Error('Failed to update campaign');
      await fetchCampaigns();
    } catch (error) {
      console.error('Error toggling campaign status:', error);
    }
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete campaign');
      await fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Automation Campaigns</h1>
            <p className="text-muted-foreground mt-1">
              Manage different content topics, schedules, and configurations.
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button className="gap-2 shadow-lg shadow-primary/25" data-testid="button-create-campaign">
              <Plus className="h-4 w-4" />
              Create New Campaign
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading campaigns...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="group hover:border-primary/50 transition-all duration-300 hover:shadow-md" data-testid={`card-campaign-${campaign.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg" data-testid={`text-campaign-name-${campaign.id}`}>{campaign.name}</CardTitle>
                      <Badge variant="secondary" className="font-normal text-xs">
                        {campaign.topic}
                      </Badge>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={campaign.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400" 
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                      }
                      data-testid={`status-campaign-${campaign.id}`}
                    >
                      {campaign.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary/70" />
                      <span>{formatSchedule(campaign.scheduleCron)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary/70" />
                      <span>{campaign.rssUrls?.length || 0} RSS Sources Configured</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary/70" />
                      <span className="text-xs">Created: {new Date(campaign.createdAt!).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 border-t bg-muted/5 flex justify-between gap-2">
                  <div className="flex gap-2">
                    <Link href={`/campaigns/${campaign.id}/details`}>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Posts
                      </Button>
                    </Link>
                    <Link href={`/campaigns/${campaign.id}`}>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5" data-testid={`button-configure-${campaign.id}`}>
                        <Settings2 className="h-3.5 w-3.5" />
                        Configure
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteCampaign(campaign.id)}
                      data-testid={`button-delete-${campaign.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className={campaign.isActive
                      ? "h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30" 
                      : "h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                    }
                    onClick={() => toggleCampaignStatus(campaign)}
                    data-testid={`button-toggle-status-${campaign.id}`}
                  >
                    {campaign.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </Button>
                </CardFooter>
              </Card>
            ))}
            
            {/* Add New Placeholder Card */}
            <Link href="/campaigns/new">
              <Card className="h-full border-dashed border-2 flex flex-col items-center justify-center p-6 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer min-h-[200px]" data-testid="card-add-campaign">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Add New Campaign</h3>
                <p className="text-sm text-center max-w-[200px]">
                  Configure a new topic, schedule, and automation rules.
                </p>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

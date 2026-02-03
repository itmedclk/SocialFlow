import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, AlertCircle, XCircle, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campaign, Post } from "@shared/schema";

interface StepProps {
  label: string;
  status: "pending" | "active" | "completed" | "error";
  description?: string;
  index: number;
}

interface PipelineVisualizerProps {
  isRunning?: boolean;
  onComplete?: () => void;
}

function getStepsFromPosts(posts: Post[]): StepProps[] {
  const drafts = posts.filter(p => p.status === "draft");
  const approved = posts.filter(p => p.status === "approved");
  const scheduled = posts.filter(p => p.status === "scheduled");
  const posted = posts.filter(p => p.status === "posted");
  const failed = posts.filter(p => p.status === "failed");

  const hasContent = posts.length > 0;
  const hasDrafts = drafts.length > 0;
  const hasApproved = approved.length > 0;
  const hasScheduled = scheduled.length > 0;
  const hasPosted = posted.length > 0;
  const hasFailed = failed.length > 0;

  return [
    { 
      label: "RSS Feed", 
      status: hasContent ? "completed" : "pending", 
      description: hasContent ? `${posts.length} articles` : "Waiting...", 
      index: 0 
    },
    { 
      label: "Dedupe Filter", 
      status: hasContent ? "completed" : "pending", 
      description: hasContent ? "Filtered" : "Check History", 
      index: 1 
    },
    { 
      label: "AI Generation", 
      status: drafts.some(p => p.generatedCaption) ? "completed" : (hasDrafts ? "active" : "pending"), 
      description: drafts.filter(p => p.generatedCaption).length > 0 
        ? `${drafts.filter(p => p.generatedCaption).length} captions` 
        : (hasDrafts ? `${drafts.length} pending` : "Caption & Tags"), 
      index: 2 
    },
    { 
      label: "Safety Check", 
      status: hasApproved || hasScheduled || hasPosted ? "completed" : "pending", 
      description: hasApproved || hasScheduled || hasPosted ? "Passed" : "Validation", 
      index: 3 
    },
    { 
      label: "Review Queue", 
      status: hasDrafts ? "active" : (hasApproved || hasScheduled ? "completed" : "pending"), 
      description: hasDrafts ? `${drafts.length} pending` : "Approved", 
      index: 4 
    },
    { 
      label: "Scheduled", 
      status: hasScheduled ? "active" : (hasPosted ? "completed" : "pending"), 
      description: hasScheduled ? `${scheduled.length} queued` : (hasPosted ? "Published" : "Schedule"), 
      index: 5 
    },
    { 
      label: "Published", 
      status: hasFailed ? "error" : (hasPosted ? "completed" : "pending"), 
      description: hasFailed ? `${failed.length} failed` : (hasPosted ? `${posted.length} posted` : "Postly API"), 
      index: 6 
    },
  ];
}

export function PipelineVisualizer({ isRunning, onComplete }: PipelineVisualizerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [steps, setSteps] = useState<StepProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isRunning) return;
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isRunning, onComplete]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = selectedCampaign !== "all" 
        ? `/api/posts?campaignId=${selectedCampaign}` 
        : '/api/posts';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
        setSteps(getStepsFromPosts(data));
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-6 md:px-0">
        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
          <SelectTrigger className="w-[250px]" data-testid="select-pipeline-campaign">
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
        <div className="text-sm text-muted-foreground">
          {posts.length} posts in pipeline
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-6 -mx-6 px-6 md:mx-0 md:px-0">
        <div className="min-w-max flex items-center gap-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative group flex flex-col items-center justify-center w-36 h-28 rounded-2xl border-2 transition-all duration-300",
                  step.status === "active" && "bg-primary/5 border-primary shadow-[0_0_20px_-5px_var(--color-primary)] scale-105",
                  step.status === "completed" && "bg-card border-primary/20",
                  step.status === "pending" && "bg-muted/30 border-muted-foreground/10 opacity-60",
                  step.status === "error" && "bg-destructive/5 border-destructive shadow-[0_0_20px_-5px_var(--color-destructive)]"
                )}
              >
                {step.status === "active" && (
                  <span className="absolute -top-3 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full tracking-wider uppercase shadow-md">
                    Active
                  </span>
                )}
                
                <div className="mb-2">
                  {step.status === "completed" && <CheckCircle2 className="h-6 w-6 text-primary" />}
                  {step.status === "active" && <Clock className="h-6 w-6 text-primary animate-pulse" />}
                  {step.status === "pending" && <Circle className="h-6 w-6 text-muted-foreground" />}
                  {step.status === "error" && <XCircle className="h-6 w-6 text-destructive" />}
                </div>

                <div className="text-center">
                  <p className={cn(
                    "font-bold text-xs",
                    step.status === "active" ? "text-primary" : "text-foreground"
                  )}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 font-medium">{step.description}</p>
                </div>
              </motion.div>
              
              {i < steps.length - 1 && (
                <div className="w-6 flex justify-center">
                  <ArrowRight className={cn(
                    "h-4 w-4",
                    step.status === "completed" ? "text-primary/50" : "text-muted-foreground/20"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

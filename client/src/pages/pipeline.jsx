import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PipelineVisualizer } from "@/components/pipeline-visualizer";
import { LogViewer } from "@/components/log-viewer";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
var MOCK_CAMPAIGNS = [
    { id: "1", name: "Alternative Health Daily", topic: "Health & Wellness" },
    { id: "2", name: "Tech Startup News", topic: "Technology" },
    { id: "3", name: "Motivational Quotes", topic: "Lifestyle" }
];
export default function Pipeline() {
    var _a = useState(false), isRunning = _a[0], setIsRunning = _a[1];
    var _b = useState("2"), selectedCampaign = _b[0], setSelectedCampaign = _b[1]; // Default to Tech Startup News
    var toast = useToast().toast;
    var activeCampaign = MOCK_CAMPAIGNS.find(function (c) { return c.id === selectedCampaign; }) || MOCK_CAMPAIGNS[0];
    var handleRunPipeline = function () {
        setIsRunning(true);
        toast({
            title: "Starting ".concat(activeCampaign.name),
            description: "Executing automation sequence for ".concat(activeCampaign.topic, "..."),
        });
    };
    var handleComplete = function () {
        setIsRunning(false);
        toast({
            title: "Pipeline Completed",
            description: "All steps finished for ".concat(activeCampaign.name, "."),
            variant: "default",
        });
    };
    return (<Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pipeline Status</h1>
            <p className="text-muted-foreground mt-1">
              Real-time view of the automation workflow.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
             <div className="w-[200px]">
               <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select Campaign"/>
                 </SelectTrigger>
                 <SelectContent>
                   {MOCK_CAMPAIGNS.map(function (campaign) { return (<SelectItem key={campaign.id} value={campaign.id}>
                       {campaign.name}
                     </SelectItem>); })}
                 </SelectContent>
               </Select>
             </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Pause className="h-4 w-4"/>
                Pause
              </Button>
              <Button className="gap-2 shadow-lg shadow-primary/25" onClick={handleRunPipeline} disabled={isRunning}>
                {isRunning ? (<>
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    Running...
                  </>) : (<>
                    <Play className="h-4 w-4"/>
                    Run Now
                  </>)}
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-primary flex items-center gap-2">
                {isRunning ? "Processing Campaign:" : "Ready to Run:"}
                <span className="text-foreground">{activeCampaign.name}</span>
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRunning ? (<span className="animate-pulse text-primary font-medium">Executing automated tasks for {activeCampaign.topic}...</span>) : (<>Next automated run scheduled for <span className="font-mono font-medium text-foreground">09:00 PST</span> using {activeCampaign.topic} settings.</>)}
              </p>
            </div>
            <Badge className={isRunning ? "bg-primary text-primary-foreground animate-pulse" : "bg-primary/20 text-primary hover:bg-primary/30 border-primary/20"}>
              {isRunning ? "Running Now" : "Standing By"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Visualizer</CardTitle>
            <CardDescription>Visual flow of data from RSS to Instagram</CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineVisualizer isRunning={isRunning} onComplete={handleComplete}/>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Execution Logs</h3>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
              <RefreshCw className="h-3 w-3"/>
              Refresh
            </Button>
          </div>
          <LogViewer />
        </div>
      </div>
    </Layout>);
}

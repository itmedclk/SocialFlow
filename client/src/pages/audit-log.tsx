import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, AlertCircle, CheckCircle2, RefreshCw, FileJson, Filter, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import type { Campaign, Log } from "@shared/schema";

function formatMetadata(metadata: unknown): string {
  if (!metadata) return "";
  try {
    return JSON.stringify(metadata);
  } catch {
    return String(metadata);
  }
}

export default function AuditLog() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCampaigns();
    fetchLogs();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [selectedCampaignId]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = selectedCampaignId !== "all" 
        ? `/api/logs?campaignId=${selectedCampaignId}&limit=100`
        : '/api/logs?limit=100';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeCampaign = campaigns.find(c => c.id.toString() === selectedCampaignId);
  
  const filteredLogs = logs.filter(log => 
    searchTerm === "" || 
    log.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return "--";
    return new Date(date).toLocaleString();
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-3 w-3" />;
      case "warning":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">
              Historical record of all system events and execution attempts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
             <div className="w-[250px]">
               <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                 <SelectTrigger className="h-9" data-testid="select-campaign-filter">
                   <div className="flex items-center gap-2">
                     <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                     <SelectValue placeholder="Select Campaign Log" />
                   </div>
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
              size="icon" 
              className="h-9 w-9"
              onClick={fetchLogs}
              data-testid="button-refresh-logs"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {activeCampaign ? `Logs: ${activeCampaign.name}` : "All System Logs"}
                </CardTitle>
                <CardDescription className="mt-1">
                  {filteredLogs.length} log entries
                </CardDescription>
              </div>
              <div className="relative w-64 hidden sm:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search logs..." 
                  className="pl-8 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="input-search-logs"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading logs...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date & Time</TableHead>
                    <TableHead className="w-[100px]">Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="group hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] flex w-fit gap-1 items-center border-0 px-2 py-0.5",
                              log.level === "info" && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                              log.level === "warning" && "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
                              log.level === "error" && "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                            )}
                          >
                            {getLevelIcon(log.level)}
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{log.message}</div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {log.campaignId && (
                              <div className="text-[10px] text-muted-foreground font-mono">
                                Campaign ID: {log.campaignId}
                              </div>
                            )}
                            {log.postId && (
                              <Link href={`/review?postId=${log.postId}`}>
                                <Button variant="link" className="h-auto p-0 text-[10px] text-primary h-fit">
                                  View Post Details
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {!!log.metadata && (
                            <span className="text-muted-foreground text-xs font-mono line-clamp-1 max-w-[300px]">
                              {formatMetadata(log.metadata)}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        No logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

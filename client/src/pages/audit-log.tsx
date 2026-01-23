import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, AlertCircle, CheckCircle2, RefreshCw, FileJson, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface PostRecord {
  id: string;
  campaignId: string;
  date: string;
  title: string;
  caption_snippet: string;
  image_credit: string;
  status: "success" | "failed";
  reason?: string;
  retry_count: number;
  guid: string;
}

const MOCK_CAMPAIGNS = [
  { id: "1", name: "Alternative Health Daily", logFile: "health_daily_posts.json" },
  { id: "2", name: "Tech Startup News", logFile: "tech_news_posts.json" },
  { id: "3", name: "Motivational Quotes", logFile: "quotes_posts.json" }
];

const MOCK_DATA: PostRecord[] = [
  {
    id: "101",
    campaignId: "1",
    date: "2026-01-22 09:00",
    title: "New Study Shows Benefits of Mindfulness",
    caption_snippet: "✨ Discover the power of mindfulness...",
    image_credit: "Unsplash/Sarah",
    status: "success",
    retry_count: 0,
    guid: "rss:health:89231"
  },
  {
    id: "102",
    campaignId: "1",
    date: "2026-01-21 09:00",
    title: "Top 5 Herbal Teas for Sleep",
    caption_snippet: "Sleep better tonight with these...",
    image_credit: "Pexels/TeaCo",
    status: "success",
    retry_count: 0,
    guid: "rss:health:89102"
  },
  {
    id: "103",
    campaignId: "1",
    date: "2026-01-20 09:02",
    title: "Warning: Vitamin D Overdose Risks",
    caption_snippet: "Important safety update regarding...",
    image_credit: "Wikimedia",
    status: "failed",
    reason: "Max retries exceeded (Caption safety check)",
    retry_count: 4,
    guid: "rss:health:88991"
  },
  {
    id: "201",
    campaignId: "2",
    date: "2026-01-22 08:30",
    title: "AI Regulation: What You Need to Know",
    caption_snippet: "🤖 The future of AI policy is here...",
    image_credit: "Unsplash/TechDaily",
    status: "success",
    retry_count: 1,
    guid: "rss:tech:44211"
  },
  {
    id: "202",
    campaignId: "2",
    date: "2026-01-21 08:30",
    title: "SpaceX Launches New Starlink Satellites",
    caption_snippet: "🚀 Another successful launch...",
    image_credit: "SpaceX/Official",
    status: "success",
    retry_count: 0,
    guid: "rss:tech:44105"
  },
  {
    id: "301",
    campaignId: "3",
    date: "2026-01-22 10:00",
    title: "Quote of the Day",
    caption_snippet: "\"Believe you can and you're halfway there.\"",
    image_credit: "Canva/Generated",
    status: "success",
    retry_count: 0,
    guid: "rss:quotes:1102"
  }
];

export default function AuditLog() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("1");
  const activeCampaign = MOCK_CAMPAIGNS.find(c => c.id === selectedCampaignId) || MOCK_CAMPAIGNS[0];
  
  const filteredData = MOCK_DATA.filter(record => record.campaignId === selectedCampaignId);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">
              Historical record of all automated posts and execution attempts.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
             <div className="w-[250px]">
               <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                 <SelectTrigger className="h-9">
                   <div className="flex items-center gap-2">
                     <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                     <SelectValue placeholder="Select Campaign Log" />
                   </div>
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
            <Button variant="outline" className="gap-2 h-9 text-xs font-mono hidden md:flex">
              <FileJson className="h-3.5 w-3.5" />
              /logs/{activeCampaign.logFile}
            </Button>
            <Button variant="secondary" size="icon" className="h-9 w-9">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Post History: {activeCampaign.name}</CardTitle>
                <CardDescription className="mt-1 font-mono text-xs">
                  Source: /var/log/socialflow/{activeCampaign.logFile}
                </CardDescription>
              </div>
              <div className="relative w-64 hidden sm:block">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-8 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Date & Time</TableHead>
                  <TableHead className="w-[80px]">Status</TableHead>
                  <TableHead>Article Title</TableHead>
                  <TableHead className="hidden md:table-cell">Caption Snippet</TableHead>
                  <TableHead className="hidden md:table-cell">Image Credit</TableHead>
                  <TableHead className="text-center w-[80px]">Retries</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((record) => (
                    <TableRow key={record.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {record.date}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[10px] flex w-fit gap-1 items-center border-0 px-2 py-0.5",
                            record.status === "success" 
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          )}
                        >
                          {record.status === "success" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                          {record.status === "success" ? "Posted" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm line-clamp-1">{record.title}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">GUID: {record.guid}</div>
                        {record.reason && (
                           <div className="text-[10px] text-red-600 font-medium mt-1">Error: {record.reason}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-muted-foreground text-xs italic line-clamp-1 max-w-[200px]">
                          "{record.caption_snippet}"
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs">{record.image_credit}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {record.retry_count > 0 ? (
                          <Badge variant="secondary" className="text-[10px] h-5">{record.retry_count}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                         <Button variant="ghost" size="sm" className="h-8 text-xs">Details</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No logs found for this campaign.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
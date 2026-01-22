import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, AlertCircle, CheckCircle2, RefreshCw, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostRecord {
  id: string;
  date: string;
  title: string;
  caption_snippet: string;
  image_credit: string;
  status: "success" | "failed";
  reason?: string;
  retry_count: number;
  guid: string;
}

const MOCK_DATA: PostRecord[] = [
  {
    id: "101",
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
    date: "2026-01-20 09:02",
    title: "Warning: Vitamin D Overdose Risks",
    caption_snippet: "Important safety update regarding...",
    image_credit: "Wikimedia",
    status: "failed",
    reason: "Safety Check: Forbidden Term 'Cure'",
    retry_count: 2,
    guid: "rss:health:88991"
  },
  {
    id: "104",
    date: "2026-01-19 09:00",
    title: "Yoga for Back Pain Relief",
    caption_snippet: "Simple stretches to ease your...",
    image_credit: "Unsplash/YogaPro",
    status: "success",
    retry_count: 1,
    guid: "rss:health:88872"
  },
  {
    id: "105",
    date: "2026-01-18 09:00",
    title: "The Gut-Brain Connection Explained",
    caption_snippet: "Your gut health impacts your mood...",
    image_credit: "Pixabay",
    status: "success",
    retry_count: 0,
    guid: "rss:health:88755"
  }
];

export default function AuditLog() {
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
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" className="gap-2 text-xs font-mono">
              <FileJson className="h-4 w-4" />
              View /logs/posts.json
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Post History</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search logs..." className="pl-8" />
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
                {MOCK_DATA.map((record) => (
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
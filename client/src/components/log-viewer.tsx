import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import type { Log } from "@shared/schema";

function formatMetadata(metadata: unknown): string {
  if (!metadata) return "";
  try {
    return JSON.stringify(metadata);
  } catch {
    return String(metadata);
  }
}

export function LogViewer() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/logs?limit=20');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return "--:--:--";
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <div className="bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 font-mono text-sm h-[400px] flex flex-col">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <span className="ml-3 text-slate-400 text-xs">system_output.log</span>
        </div>
        <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 h-5 text-[10px] px-2">
          LIVE
        </Badge>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="text-slate-500 text-center py-4">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-slate-500 text-center py-4">No logs available</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="group flex gap-3 hover:bg-slate-900/50 -mx-2 px-2 py-1 rounded transition-colors">
                <span className="text-slate-500 shrink-0 w-20">{formatTime(log.createdAt)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 w-16 text-center",
                      log.level === "info" && "bg-blue-500/10 text-blue-400",
                      log.level === "warning" && "bg-amber-500/10 text-amber-400",
                      log.level === "error" && "bg-red-500/10 text-red-400",
                    )}>
                      {log.level}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-slate-300 font-medium truncate">{log.message}</span>
                      {log.postId && (
                        <Link href={`/review?postId=${log.postId}`}>
                          <Button variant="link" className="h-auto p-0 text-xs text-primary w-fit mt-1">
                            View Scheduled Post Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                  {!!log.metadata && (
                    <p className="text-slate-500 mt-1 pl-[76px] text-xs font-mono truncate">
                      {formatMetadata(log.metadata)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 animate-pulse pl-[104px] pt-2">
              <span className="h-4 w-2 bg-emerald-500/50 block" />
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

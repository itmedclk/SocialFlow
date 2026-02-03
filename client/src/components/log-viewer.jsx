var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Link } from "wouter";
function formatMetadata(metadata) {
    if (!metadata)
        return "";
    try {
        return JSON.stringify(metadata);
    }
    catch (_a) {
        return String(metadata);
    }
}
export function LogViewer() {
    var _this = this;
    var _a = useState([]), logs = _a[0], setLogs = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    useEffect(function () {
        fetchLogs();
        var interval = setInterval(fetchLogs, 10000);
        return function () { return clearInterval(interval); };
    }, []);
    var fetchLogs = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/logs?limit=20')];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to fetch logs');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setLogs(data);
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error fetching logs:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var formatTime = function (date) {
        if (!date)
            return "--:--:--";
        var d = new Date(date);
        return d.toLocaleTimeString('en-US', { hour12: false });
    };
    return (<div className="bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 font-mono text-sm h-[400px] flex flex-col">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"/>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"/>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50"/>
          </div>
          <span className="ml-3 text-slate-400 text-xs">system_output.log</span>
        </div>
        <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 h-5 text-[10px] px-2">
          LIVE
        </Badge>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {loading ? (<div className="text-slate-500 text-center py-4">Loading logs...</div>) : logs.length === 0 ? (<div className="text-slate-500 text-center py-4">No logs available</div>) : (<div className="space-y-3">
            {logs.map(function (log) { return (<div key={log.id} className="group flex gap-3 hover:bg-slate-900/50 -mx-2 px-2 py-1 rounded transition-colors">
                <span className="text-slate-500 shrink-0 w-20">{formatTime(log.createdAt)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={cn("uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded shrink-0 w-16 text-center", log.level === "info" && "bg-blue-500/10 text-blue-400", log.level === "warning" && "bg-amber-500/10 text-amber-400", log.level === "error" && "bg-red-500/10 text-red-400")}>
                      {log.level}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-slate-300 font-medium truncate">{log.message}</span>
                      {log.postId && (<Link href={"/review?postId=".concat(log.postId)}>
                          <Button variant="link" className="h-auto p-0 text-xs text-primary w-fit mt-1">
                            View Scheduled Post Details
                          </Button>
                        </Link>)}
                    </div>
                  </div>
                  {!!log.metadata && (<p className="text-slate-500 mt-1 pl-[76px] text-xs font-mono truncate">
                      {formatMetadata(log.metadata)}
                    </p>)}
                </div>
              </div>); })}
            <div className="flex items-center gap-2 animate-pulse pl-[104px] pt-2">
              <span className="h-4 w-2 bg-emerald-500/50 block"/>
            </div>
          </div>)}
      </ScrollArea>
    </div>);
}

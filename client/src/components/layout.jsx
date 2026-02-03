import { Link, useLocation } from "wouter";
import { LayoutDashboard, Activity, Settings, FileText, Menu, ShieldCheck, PenTool, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
var NAV_ITEMS = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    { icon: Layers, label: "Campaigns", href: "/campaigns" },
    { icon: Activity, label: "Pipeline Status", href: "/pipeline" },
    { icon: PenTool, label: "Content Review", href: "/review" },
    { icon: FileText, label: "Audit Logs", href: "/logs" },
    { icon: Settings, label: "Global Settings", href: "/settings" },
];
export function Layout(_a) {
    var children = _a.children;
    var location = useLocation()[0];
    var _b = useState(false), open = _b[0], setOpen = _b[1];
    var NavContent = function () { return (<div className="flex flex-col h-full bg-sidebar/50 backdrop-blur-xl border-r border-border/40">
      <div className="p-6 border-b border-border/40 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary ring-1 ring-primary/20 shadow-[0_0_15px_-3px_var(--color-primary)]">
          <ShieldCheck className="h-6 w-6"/>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">SocialFlow</h1>
          <p className="text-xs text-muted-foreground font-medium">Automation v2.0</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {NAV_ITEMS.map(function (item) {
            var isActive = location === item.href;
            return (<Link key={item.href} href={item.href}>
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group font-medium", isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1")}>
                <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")}/>
                {item.label}
              </div>
            </Link>);
        })}
      </nav>

      <div className="p-4 border-t border-border/40">
        <div className="bg-card/50 p-4 rounded-xl border border-border/40 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">System Status</p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"/>
            <span>Operational</span>
          </div>
          <p className="mt-2 opacity-70">Next run: 09:00 PST</p>
        </div>
      </div>
    </div>); };
    return (<div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-72 fixed inset-y-0 z-50">
        <NavContent />
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border/40 z-40 flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6"/>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-r border-border/40 w-72">
            <NavContent />
          </SheetContent>
        </Sheet>
        <span className="ml-4 font-bold text-lg">SocialFlow</span>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pt-16 md:pt-0 min-h-screen transition-all">
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>);
}

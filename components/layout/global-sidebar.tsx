"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquare, ImageIcon, FolderOpen, PanelLeft, Settings } from "lucide-react";

interface GlobalSidebarProps {
  activeView: "chat" | "gallery" | "files";
  onViewChange: (view: "chat" | "gallery" | "files") => void;
  workspaceSidebarOpen: boolean;
  onToggleWorkspaceSidebar: () => void;
}

interface NavItem {
  id: "chat" | "gallery" | "files";
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { id: "chat", icon: <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.5} />, label: "Chat" },
  { id: "gallery", icon: <ImageIcon className="h-[18px] w-[18px]" strokeWidth={1.5} />, label: "Gallery" },
  { id: "files", icon: <FolderOpen className="h-[18px] w-[18px]" strokeWidth={1.5} />, label: "Files" },
];

export function GlobalSidebar({
  activeView,
  onViewChange,
  workspaceSidebarOpen,
  onToggleWorkspaceSidebar,
}: GlobalSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-14 flex-col bg-background">
        {/* Logo mark */}
        <div className="flex h-14 items-center justify-center border-b border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleWorkspaceSidebar}
                className="h-8 w-8 rounded-sm text-muted-foreground hover:text-foreground"
                aria-label={workspaceSidebarOpen ? "Hide conversations" : "Show conversations"}
              >
                <PanelLeft className={cn("h-4 w-4 transition-transform duration-200", !workspaceSidebarOpen && "rotate-180")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {workspaceSidebarOpen ? "Hide Panel" : "Show Panel"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-0.5 py-3">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "h-9 w-9 rounded-sm transition-all",
                    activeView === item.id
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {item.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        {/* Settings */}
        <div className="flex h-14 items-center justify-center border-t border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-sm text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MessageSquare, Image, FolderOpen, PanelLeft, Settings } from "lucide-react";

interface GlobalSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  activeView: "chat" | "gallery" | "files";
  onViewChange: (view: "chat" | "gallery" | "files") => void;
}

interface NavItem {
  id: "chat" | "gallery" | "files";
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { id: "chat", icon: <MessageSquare className="h-5 w-5" />, label: "Chat" },
  { id: "gallery", icon: <Image className="h-5 w-5" />, label: "Gallery" },
  { id: "files", icon: <FolderOpen className="h-5 w-5" />, label: "Files" },
];

export function GlobalSidebar({
  isCollapsed,
  onToggle,
  activeView,
  onViewChange,
}: GlobalSidebarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-background sidebar-transition",
          isCollapsed ? "w-14" : "w-16"
        )}
      >
        {/* Logo / Toggle */}
        <div className="flex h-14 items-center justify-center border-b border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <PanelLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-1 py-4">
          {navItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "h-10 w-10 rounded-lg transition-colors",
                    activeView === item.id
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
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
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

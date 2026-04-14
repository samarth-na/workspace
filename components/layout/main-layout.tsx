"use client";

import { useState } from "react";
import { GlobalSidebar } from "./global-sidebar";
import { WorkspaceSidebar } from "./workspace-sidebar";
import type { Conversation } from "@/lib/types";

interface MainLayoutProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  activeView: "chat" | "gallery" | "files";
  onViewChange: (view: "chat" | "gallery" | "files") => void;
}

export function MainLayout({
  children,
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  activeView,
  onViewChange,
}: MainLayoutProps) {
  const [workspaceSidebarOpen, setWorkspaceSidebarOpen] = useState(true);
  const workspaceSidebarWidth = 380;

  const toggleWorkspaceSidebar = () => setWorkspaceSidebarOpen((prev) => !prev);

  // Instead of absolute positioning and margin-left pixel math, 
  // we use a flex layout to ensure fluid adaptability and correct DOM flow.
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Global Sidebar - Fixed width flex child */}
      <div className="shrink-0 border-r border-border">
        <GlobalSidebar
          activeView={activeView}
          onViewChange={onViewChange}
          workspaceSidebarOpen={workspaceSidebarOpen}
          onToggleWorkspaceSidebar={toggleWorkspaceSidebar}
        />
      </div>

      {/* Workspace Sidebar - Collapsible flex child */}
      {activeView === "chat" && workspaceSidebarOpen && (
        <div
          className="shrink-0 border-r border-border"
          style={{ width: `${workspaceSidebarWidth}px`, minWidth: `${workspaceSidebarWidth}px` }}
        >
          <WorkspaceSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onConversationSelect={onConversationSelect}
            onNewConversation={onNewConversation}
            width={workspaceSidebarWidth}
          />
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col relative overflow-hidden bg-background">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

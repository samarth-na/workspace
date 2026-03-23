"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
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
  const [globalSidebarCollapsed, setGlobalSidebarCollapsed] = useState(false);
  const [workspaceSidebarCollapsed, setWorkspaceSidebarCollapsed] = useState(false);

  const toggleGlobalSidebar = () => setGlobalSidebarCollapsed(!globalSidebarCollapsed);
  const toggleWorkspaceSidebar = () => setWorkspaceSidebarCollapsed(!workspaceSidebarCollapsed);

  // Calculate main content margin based on sidebar states
  const getMainMargin = () => {
    const globalWidth = globalSidebarCollapsed ? 56 : 64;
    const workspaceWidth = activeView === "chat" && !workspaceSidebarCollapsed ? 280 : 0;
    return globalWidth + workspaceWidth;
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Global Sidebar */}
      <GlobalSidebar
        isCollapsed={globalSidebarCollapsed}
        onToggle={toggleGlobalSidebar}
        activeView={activeView}
        onViewChange={onViewChange}
      />

      {/* Workspace Sidebar - Only show for chat view */}
      {activeView === "chat" && (
        <WorkspaceSidebar
          isCollapsed={workspaceSidebarCollapsed}
          onToggle={toggleWorkspaceSidebar}
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={onConversationSelect}
          onNewConversation={onNewConversation}
        />
      )}

      {/* Main Content */}
      <main
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: getMainMargin() }}
      >
        {children}
      </main>
    </div>
  );
}

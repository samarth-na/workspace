"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/shared/search-bar";
import { ConversationListItem } from "@/components/shared/conversation-list-item";
import { EmptyState } from "@/components/shared/empty-state";
import { PanelLeft, Plus, Users } from "lucide-react";
import type { Conversation } from "@/lib/types";

interface WorkspaceSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  width?: number;
}

export function WorkspaceSidebar({
  isCollapsed,
  onToggle,
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  width = 280,
}: WorkspaceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isCollapsed) {
    return null;
  }

  return (
    <aside
      className="fixed left-16 top-0 z-40 flex h-full flex-col border-r border-border bg-background"
      style={{ width }}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Conversations</h2>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border p-3">
        <SearchBar
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="py-8">
              <EmptyState
                type="search"
                title="No conversations found"
                description={searchQuery ? "Try a different search term" : "Start a new conversation"}
              />
            </div>
          ) : (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <ConversationListItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === activeConversationId}
                  onClick={() => onConversationSelect(conversation.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}

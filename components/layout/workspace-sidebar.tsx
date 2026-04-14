"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/shared/search-bar";
import { ConversationListItem } from "@/components/shared/conversation-list-item";
import { EmptyState } from "@/components/shared/empty-state";
import { Plus, MessageCircle } from "lucide-react";
import type { Conversation } from "@/lib/types";

interface WorkspaceSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  width?: number;
}

export function WorkspaceSidebar({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  width = 300,
}: WorkspaceSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="flex h-full w-full flex-col bg-background" style={{ width: `${width}px` }}>
      {/* Header - Asymmetric */}
      <div className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/60 px-5 glass-effect">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" strokeWidth={2} />
          <h2 className="text-sm font-semibold text-foreground tracking-[-0.01em]">Messages</h2>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewConversation}
            className="h-7 w-7 rounded-sm text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border px-5 py-3.5">
        <SearchBar
          placeholder="Search..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>

      {/* Conversation List - Tight spacing */}
      <ScrollArea className="flex-1">
        {filteredConversations.length === 0 ? (
          <div className="py-12">
            <EmptyState
              type="search"
              title="No conversations"
              description={searchQuery ? "Try a different search" : "Start a new conversation"}
            />
          </div>
        ) : (
          <div className="space-y-1 py-3">
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
      </ScrollArea>
    </aside>
  );
}

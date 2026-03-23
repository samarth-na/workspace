import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Conversation } from "@/lib/types";
import { getUserById } from "@/lib/data";
import { StatusIndicator } from "./status-indicator";
import { Users } from "lucide-react";

interface ConversationListItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const isGroup = conversation.type === "group";
  const otherUser = !isGroup ? getUserById(conversation.participants.find(p => p !== "current-user") || "") : null;
  
  const statusColors: Record<string, string> = {
    open: "bg-muted-foreground",
    in_progress: "bg-warning",
    resolved: "bg-success",
    pending: "bg-status-offline",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        isActive
          ? "bg-accent"
          : "hover:bg-accent/50"
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {conversation.avatar ? (
          <img
            src={conversation.avatar}
            alt={conversation.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
            {conversation.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        
        {/* Status indicator for direct chats */}
        {!isGroup && otherUser && (
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusIndicator status={otherUser.status} size="sm" />
          </div>
        )}
        
        {/* Group indicator */}
        {isGroup && (
          <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-muted text-[10px]">
            <Users className="h-2.5 w-2.5" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-sm font-medium text-foreground">
            {conversation.name}
          </h4>
          
          {conversation.lastMessage && (
            <span className="flex-shrink-0 text-xs text-muted-foreground">
              {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: false })}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-xs text-muted-foreground">
            {conversation.lastMessage?.content || "No messages yet"}
          </p>
          
          {conversation.unreadCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

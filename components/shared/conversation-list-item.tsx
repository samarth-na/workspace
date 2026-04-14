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

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "group flex w-full items-start gap-3.5 overflow-hidden border-l-2 px-5 py-3.5 text-left transition-all",
        isActive
          ? "border-primary bg-muted/50"
          : "border-transparent hover:border-border hover:bg-muted/30"
      )}
    >
      {/* Avatar - Sharp corners */}
      <div className="relative flex-shrink-0">
        {conversation.avatar ? (
          <img
            src={conversation.avatar}
            alt={conversation.name}
            className="h-10 w-10 rounded-sm object-cover ring-1 ring-border"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted text-xs font-semibold text-muted-foreground ring-1 ring-border">
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
          <div className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-muted text-[8px] ring-1 ring-border">
            <Users className="h-2 w-2" />
          </div>
        )}
      </div>

      {/* Content - Asymmetric layout */}
      <div className="min-w-0 flex-1 overflow-hidden pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
            <h4 className={cn(
              "truncate text-[13px] font-semibold tracking-[-0.01em]",
              isActive ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
            )}>
            {conversation.name}
          </h4>

          {conversation.lastMessage && (
            <span className="max-w-[8.5rem] flex-shrink-0 truncate whitespace-nowrap text-right text-[11px] text-muted-foreground/85">
              {formatDistanceToNow(conversation.lastMessage.timestamp, { addSuffix: false })}
            </span>
          )}
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          <p className={cn(
            "flex-1 truncate text-[12px] leading-[1.4]",
            conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {conversation.lastMessage?.content || "No messages yet"}
          </p>

          {conversation.unreadCount > 0 && (
            <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-sm bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

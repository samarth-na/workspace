import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName: string;
  senderAvatar?: string;
  showAvatar?: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  senderName,
  senderAvatar,
  showAvatar = true,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex gap-3",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatar && (
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {senderName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}
      
      <div
        className={cn(
          "flex max-w-[70%] flex-col gap-1",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "message-bubble rounded-2xl px-4 py-2.5 text-sm",
            isOwn ? "message-bubble-own rounded-br-md" : "message-bubble-other rounded-bl-md"
          )}
        >
          {message.content}
        </div>
        
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          {message.edited && " (edited)"}
        </span>
      </div>
    </div>
  );
}

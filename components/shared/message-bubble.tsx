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
        "flex gap-2.5",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      {showAvatar && (
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName}
              className="h-8 w-8 rounded-full object-cover ring-1 ring-border/50"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground ring-1 ring-border/50">
              {senderName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-0.5",
          isOwn ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "relative px-4 py-2 text-[14px] leading-[1.4] tracking-[-0.01em]",
            isOwn
              ? "bg-primary text-primary-foreground rounded-[18px] rounded-br-[4px]"
              : "bg-secondary text-foreground rounded-[18px] rounded-bl-[4px] border border-border/40 shadow-sm shadow-black/5"
          )}
        >
          {message.content}
        </div>

        <span className="text-[11px] text-muted-foreground font-medium tracking-[0.02em] uppercase mt-0.5">
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          {message.edited && " · edited"}
        </span>
      </div>
    </div>
  );
}

/**
 * MessageItem - Individual message display
 */
"use client"

import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Message } from "./types"

interface MessageItemProps {
  message: Message
  isCurrentUser?: boolean
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="text-xs text-muted-foreground">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex gap-3 px-6 py-2 hover:bg-muted/30",
        isCurrentUser && "flex-row-reverse"
      )}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={message.sender.avatar} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {message.sender.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex min-w-0 flex-col", isCurrentUser && "items-end")}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {message.sender.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(message.timestamp, "h:mm a")}
          </span>
          {message.edited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        <p className={cn(
          "mt-0.5 text-sm text-foreground",
          isCurrentUser && "text-right"
        )}>
          {message.content}
        </p>
      </div>
    </div>
  )
}

/**
 * ChatView - Main chat interface
 */
"use client"

import { useRef, useEffect } from "react"
import { Settings, Users } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { MessageItem } from "./message-item"
import { MessageInput } from "./message-input"
import type { Message } from "./types"

interface ChatViewProps {
  channelName: string
  messages: Message[]
  onlineCount: number
  currentUserId: string
  onSendMessage: (content: string) => void
}

export function ChatView({
  channelName,
  messages,
  onlineCount,
  currentUserId,
  onSendMessage,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-foreground">
            #{channelName}
          </h2>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>{onlineCount} online</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Settings className="size-4" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="py-4">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isCurrentUser={message.sender.id === currentUserId}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput onSend={onSendMessage} />
    </div>
  )
}

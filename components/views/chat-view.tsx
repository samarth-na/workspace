"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "@/components/shared/message-bubble";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusIndicator } from "@/components/shared/status-indicator";
import { getMessagesForConversation, getActivitiesForConversation, getUserById } from "@/lib/data";
import type { Conversation, DirectConversation } from "@/lib/types";
import { Paperclip, Send, MoreVertical } from "lucide-react";

interface ChatViewProps {
  conversation: Conversation | null;
  currentUserId: string;
}

export function ChatView({ conversation, currentUserId }: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messages = conversation ? getMessagesForConversation(conversation.id) : [];
  const activities = conversation ? getActivitiesForConversation(conversation.id) : [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          type="chat"
          title="Select a conversation"
          description="Choose a conversation from the sidebar to start chatting"
        />
      </div>
    );
  }

  const isDirect = conversation.type === "direct";
  const otherUser = isDirect
    ? getUserById((conversation as DirectConversation).otherUserId)
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            {conversation.avatar ? (
              <img
                src={conversation.avatar}
                alt={conversation.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {conversation.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {isDirect && otherUser && (
              <div className="absolute -bottom-0.5 -right-0.5">
                <StatusIndicator status={otherUser.status} size="sm" />
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">
              {conversation.name}
            </h2>
            {isDirect && otherUser ? (
              <p className="text-[11px] text-muted-foreground capitalize">
                {otherUser.status}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                {conversation.participants.length} members
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="space-y-6 p-4">
          {/* Activity Timeline */}
          {activities.length > 0 && <ActivityTimeline activities={activities} />}

          {/* Messages */}
          {messages.length === 0 ? (
            <EmptyState
              type="chat"
              title="No messages yet"
              description="Send a message to start the conversation"
            />
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const sender = getUserById(message.senderId);
                const isOwn = message.senderId === currentUserId;

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={isOwn}
                    senderName={sender?.name || "Unknown"}
                    senderAvatar={sender?.avatar}
                  />
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t border-border/60 bg-background/80 backdrop-blur-md p-4">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Paperclip className="h-5 w-5" strokeWidth={1.5} />
          </Button>

          <Input
            placeholder="iMessage"
            className="flex-1 h-10 rounded-full border-border/50 bg-secondary/50 px-4 text-[14px] focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-background transition-all shadow-inner shadow-black/5"
          />

          <Button size="icon" className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 transition-transform active:scale-95">
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

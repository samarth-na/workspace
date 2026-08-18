"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hash, Plus, Search, Users } from "pixelarticons/react";
import { useState } from "react";
import { relativeTime } from "@/components/chat/chat-api";
import { useShell } from "@/components/shell/shell-context";
import type { ConversationSummary } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

function ConversationList({
  conversations,
  loading,
  onNewMessage,
}: {
  conversations: ConversationSummary[];
  loading: boolean;
  onNewMessage: () => void;
}) {
  const { userName, isSignedIn } = useShell();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? conversations.filter((conversation) =>
        conversation.name.toLowerCase().includes(needle),
      )
    : conversations;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-[#e5e7ec] bg-white p-3">
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#e5e7ec] px-2.5 py-1.5 focus-within:border-[#c7cbe0]">
        <Search
          className="size-3.5 shrink-0 text-[#9aa1ad]"
          aria-hidden="true"
        />
        <input
          aria-label="Search conversations"
          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#a1a8b5]"
          placeholder="Search conversations..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="workspace-sidebar-scroll min-h-0 flex-1 overflow-y-auto">
        {loading && conversations.length === 0 ? (
          <ConversationSkeleton />
        ) : filtered.length === 0 ? (
          <p className="px-2 py-8 text-center text-[12px] text-[#9aa1ad]">
            No conversations
          </p>
        ) : (
          filtered.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              active={pathname === `/messages/${conversation.id}`}
              userName={userName}
              isSignedIn={isSignedIn}
            />
          ))
        )}
      </div>
      <button
        type="button"
        aria-label="New message or group"
        title="New message or group"
        onClick={onNewMessage}
        className="mt-2 flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#5b64d6] text-[12px] font-semibold text-white shadow-[0_3px_9px_rgba(91,100,214,0.2)] transition-colors hover:bg-[#4e57c5] active:bg-[#454db8]"
      >
        <Plus className="size-3.5" />
        New message
      </button>
    </div>
  );
}

function ConversationRow({
  conversation,
  active,
  userName,
  isSignedIn,
}: {
  conversation: ConversationSummary;
  active: boolean;
  userName: string;
  isSignedIn: boolean;
}) {
  const lastMessage = conversation.lastMessage;
  const peer =
    conversation.type === "dm"
      ? (conversation.members.find((member) => member.name !== userName) ??
        conversation.members[0])
      : null;
  const preview = lastMessage
    ? isSignedIn && lastMessage.sender.name === userName
      ? `You: ${lastMessage.body}`
      : lastMessage.body
    : "No messages yet";
  const timestamp = lastMessage
    ? lastMessage.createdAt
    : conversation.updatedAt;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
        active
          ? "bg-[#eef0ff] font-semibold text-[#535dc9]"
          : "text-[#697184] hover:bg-[#f5f6f8]",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        {peer ? (
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-[#31518e]"
            style={{ backgroundColor: peer.color }}
          >
            {peer.initials}
          </span>
        ) : conversation.type === "group" ? (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#eef0ff] text-[#6972cd]">
            <Users className="size-3.5" aria-hidden="true" />
          </span>
        ) : (
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#f0f0f1] text-[#858589]">
            <Hash className="size-3.5" aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate",
              conversation.unreadCount > 0 && "font-semibold text-[#20293c]",
            )}
          >
            {conversation.name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[#9aa1ad]">
            {preview}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="text-[10px] text-[#a0a6b2]">
          {relativeTime(timestamp)}
        </span>
        {conversation.unreadCount > 0 ? (
          <span className="flex size-4 items-center justify-center rounded-full bg-[#6873dc] text-[9px] font-medium text-white">
            {conversation.unreadCount}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex items-center gap-2.5 px-3 py-2.5">
          <span className="size-6 shrink-0 animate-pulse rounded-full bg-[#eff0f3]" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-2/3 animate-pulse rounded-md bg-[#f0f1f4]" />
            <div className="h-2.5 w-5/6 animate-pulse rounded-md bg-[#f3f4f7]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { ConversationList };

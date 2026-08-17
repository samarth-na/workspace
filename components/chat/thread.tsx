"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Bulletlist,
  Loader,
  Phone,
  Smile,
} from "pixelarticons/react";
import { Fragment, useEffect, useRef, useState } from "react";
import { createCall } from "@/components/calls/call-api";
import { CallPanel } from "@/components/calls/call-panel";
import {
  fetchConversations,
  fetchMessages,
  formatTime,
  markConversationRead,
  toggleReactionRest,
} from "@/components/chat/chat-api";
import {
  getChatSocket,
  isSocketConnected,
  onServerEvent,
  toggleChatReaction,
} from "@/components/chat/chat-socket";
import { Composer } from "@/components/chat/composer";
import { useShell } from "@/components/shell/shell-context";
import type { ChatMessage, ConversationSummary } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

const EMOJI_PALETTE = ["👍", "❤️", "😂", "🎉", "🔥", "👀", "✅", "🚀"];

function Thread({ conversationId }: { conversationId: string }) {
  const { userName, isSignedIn, navigate, notify } = useShell();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const pendingRef = useRef(new Map<string, string>());
  const nearBottomRef = useRef(true);
  const typingTimeoutsRef = useRef<Record<string, number>>({});
  const notifyRef = useRef(notify);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<number | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [conversation, setConversation] = useState<ConversationSummary | null>(
    null,
  );
  const [metaLoading, setMetaLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [typingUsers, setTypingUsers] = useState<
    { userId: string; name: string }[]
  >([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [startingCall, setStartingCall] = useState(false);

  useEffect(() => {
    notifyRef.current = notify;
  }, [notify]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    setHasMore(false);
    setNextBefore(null);
    fetchMessages(conversationId)
      .then((data) => {
        if (cancelled) return;
        setMessages((prev) => mergeMessages(data.messages, prev));
        setHasMore(data.hasMore);
        setNextBefore(data.nextBefore);
      })
      .catch(() => {
        // keep the thread empty on load failure
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    let cancelled = false;
    setMetaLoading(true);
    fetchConversations()
      .then((data) => {
        if (cancelled) return;
        setConversation(
          data.conversations.find((current) => current.id === conversationId) ??
            null,
        );
      })
      .catch(() => {
        // keep the meta hidden on load failure
      })
      .finally(() => {
        if (!cancelled) setMetaLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!isSignedIn) return;
    markConversationRead(conversationId)
      .then(() => {
        window.dispatchEvent(new Event("chat:local-change"));
      })
      .catch(() => {
        // reading progress is best-effort
      });
  }, [conversationId, isSignedIn]);

  useEffect(() => {
    const socket = getChatSocket();
    socket.emit("chat:join", { conversationIds: [conversationId] });
    const onConnect = () => {
      socket.emit("chat:join", { conversationIds: [conversationId] });
    };
    socket.on("connect", onConnect);

    const unsubscribe = onServerEvent((event) => {
      switch (event.type) {
        case "message:new": {
          const incoming = event.payload;
          if (incoming.conversationId !== conversationId) return;
          if (
            messagesRef.current.some((current) => current.id === incoming.id)
          ) {
            return;
          }
          if (isSignedIn && incoming.sender.name === userName) {
            const optimisticId = findPendingByBody(
              pendingRef.current,
              incoming.body,
            );
            if (optimisticId !== undefined) {
              pendingRef.current.delete(optimisticId);
              setMessages((prev) =>
                prev.map((current) =>
                  current.id === optimisticId ? incoming : current,
                ),
              );
              return;
            }
          }
          setMessages((prev) => [...prev, incoming]);
          if (isSignedIn && incoming.sender.name !== userName) {
            markConversationRead(conversationId).catch(() => {
              // reading progress is best-effort
            });
          }
          return;
        }
        case "message:sent": {
          const { clientId, message } = event.payload;
          if (message.conversationId !== conversationId) return;
          pendingRef.current.delete(clientId);
          setMessages((prev) => {
            if (!prev.some((current) => current.id === clientId)) return prev;
            return prev.map((current) =>
              current.id === clientId ? message : current,
            );
          });
          return;
        }
        case "message:failed": {
          const { clientId } = event.payload;
          if (event.payload.conversationId !== conversationId) return;
          pendingRef.current.delete(clientId);
          const failed = messagesRef.current.find(
            (current) => current.id === clientId,
          );
          setMessages((prev) =>
            prev.filter((current) => current.id !== clientId),
          );
          if (failed) setDraft(failed.body);
          notifyRef.current("Message failed to send");
          return;
        }
        case "reaction:update": {
          const { messageId, reactions } = event.payload;
          if (event.payload.conversationId !== conversationId) return;
          setMessages((prev) =>
            prev.map((current) =>
              current.id === messageId ? { ...current, reactions } : current,
            ),
          );
          return;
        }
        case "typing": {
          const typing = event.payload;
          if (typing.conversationId !== conversationId) return;
          if (!isSignedIn || typing.name === userName) return;
          setTypingUsers((prev) =>
            prev.some((user) => user.userId === typing.userId)
              ? prev
              : [...prev, { userId: typing.userId, name: typing.name }],
          );
          window.clearTimeout(typingTimeoutsRef.current[typing.userId]);
          typingTimeoutsRef.current[typing.userId] = window.setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((user) => user.userId !== typing.userId),
            );
          }, 4000);
          return;
        }
        default:
          return;
      }
    });

    return () => {
      socket.off("connect", onConnect);
      unsubscribe();
      for (const timer of Object.values(typingTimeoutsRef.current)) {
        window.clearTimeout(timer);
      }
      typingTimeoutsRef.current = {};
    };
  }, [conversationId, isSignedIn, userName]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (!nearBottomRef.current) return;
    const element = scrollRef.current;
    if (!element) return;
    requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });
  }, [messages]);

  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    nearBottomRef.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  };

  const loadOlder = async () => {
    if (nextBefore === null || loadingOlder) return;
    const scroll = scrollRef.current;
    const previousHeight = scroll?.scrollHeight ?? 0;
    setLoadingOlder(true);
    try {
      const data = await fetchMessages(conversationId, nextBefore);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setNextBefore(data.nextBefore);
      const element = scrollRef.current;
      if (element) {
        requestAnimationFrame(() => {
          element.scrollTop = element.scrollHeight - previousHeight;
        });
      }
    } catch {
      // loading older messages is best-effort
    } finally {
      setLoadingOlder(false);
    }
  };

  const appendMessage = (temporary: ChatMessage) => {
    pendingRef.current.set(temporary.id, temporary.body);
    setMessages((prev) => [...prev, temporary]);
    setDraft("");
  };

  const replaceMessage = (clientId: string, message: ChatMessage) => {
    pendingRef.current.delete(clientId);
    setMessages((prev) => {
      if (!prev.some((current) => current.id === clientId)) return prev;
      return prev.map((current) =>
        current.id === clientId ? message : current,
      );
    });
  };

  const failMessage = (clientId: string, body: string) => {
    pendingRef.current.delete(clientId);
    setMessages((prev) => prev.filter((current) => current.id !== clientId));
    setDraft(body);
    notifyRef.current("Message failed to send");
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (isSocketConnected()) {
      toggleChatReaction({ conversationId, messageId, emoji });
      return;
    }
    toggleReactionRest(messageId, emoji)
      .then((response) => {
        setMessages((prev) =>
          prev.map((current) =>
            current.id === messageId
              ? { ...current, reactions: response.reactions }
              : current,
          ),
        );
      })
      .catch(() => notifyRef.current("Could not update reaction"));
  };

  const members = conversation?.members ?? [];
  const subtitle = conversation
    ? conversation.type === "group"
      ? `${members.length} member${members.length === 1 ? "" : "s"}${conversation.topic ? ` · ${conversation.topic}` : ""}`
      : conversation.type === "dm"
        ? "Direct message"
        : (conversation.topic ?? "")
    : "";
  const typingLabel = typingUsers.map((user) => user.name).join(", ");

  const startCall = async () => {
    if (startingCall || !conversation) return;
    setStartingCall(true);
    try {
      const data = await createCall({
        memberIds: conversation.members.map((member) => member.id),
      });
      setActiveCallId(data.callId);
      notify("Call started");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not start call");
    } finally {
      setStartingCall(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white">
      <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/messages"
            aria-label="Back to conversations"
            className="rounded-md p-1.5 text-[#9299a8] transition-colors hover:bg-[#f2f3f6] lg:hidden"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            {metaLoading ? (
              <div className="h-4 w-32 animate-pulse rounded-md bg-[#eff0f3]" />
            ) : (
              <h3 className="truncate text-[14px] font-semibold text-[#30394c]">
                {conversation?.name ?? "Conversation"}
              </h3>
            )}
            {isSignedIn && typingUsers.length > 0 ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#969eac]">
                <span className="size-1 animate-pulse rounded-full bg-[#6873dc]" />
                {typingLabel} is typing…
              </p>
            ) : metaLoading ? (
              <div className="mt-1.5 h-3 w-44 animate-pulse rounded-md bg-[#f3f4f7]" />
            ) : (
              <p className="mt-0.5 truncate text-[11px] text-[#969eac]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {isSignedIn ? (
          <button
            type="button"
            aria-label={`Start a call with ${members.map((member) => member.name).join(", ") || "this conversation"}`}
            title="Start a call"
            disabled={startingCall || members.length === 0}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-[#6972cd] transition-colors hover:bg-[#eef0ff] disabled:cursor-default disabled:opacity-40"
            onClick={() => void startCall()}
          >
            {startingCall ? (
              <Loader className="size-3.5 animate-spin" />
            ) : (
              <Phone className="size-3.5" />
            )}
          </button>
        ) : null}
        {members.length > 0 ? (
          <div className="ml-3 flex shrink-0 items-center -space-x-1.5">
            {members.slice(0, 3).map((member) => (
              <span
                key={member.id}
                title={member.name}
                className="flex size-6 items-center justify-center rounded-full border-2 border-white text-[9px] font-semibold text-[#31518e]"
                style={{ backgroundColor: member.color }}
              >
                {member.initials}
              </span>
            ))}
            {members.length > 3 ? (
              <span className="flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#f1f2f6] text-[9px] font-semibold text-[#697184]">
                +{members.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="workspace-sidebar-scroll flex-1 overflow-y-auto p-5"
      >
        {hasMore ? (
          <div className="flex justify-center pb-3">
            <button
              type="button"
              disabled={loadingOlder}
              onClick={() => loadOlder()}
              className="text-[12px] font-semibold text-[#6972cd] transition-colors hover:text-[#4b55bd] disabled:cursor-default disabled:opacity-40"
            >
              {loadingOlder ? "Loading…" : "Load older messages"}
            </button>
          </div>
        ) : null}
        {loading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <p className="py-10 text-center text-[12px] text-[#9aa1ad]">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((message, index) => {
            const previous = messages[index - 1];
            const newDay =
              index > 0 &&
              dayKey(message.createdAt) !== dayKey(previous.createdAt);
            const grouped =
              index > 0 &&
              !newDay &&
              previous.sender.id === message.sender.id &&
              previous.sender.name === message.sender.name &&
              formatTime(previous.createdAt) === formatTime(message.createdAt);
            return (
              <Fragment key={message.id}>
                {newDay ? (
                  <div className="mt-5">
                    <DaySeparator timestamp={message.createdAt} />
                  </div>
                ) : null}
                <div className={grouped ? "mt-1" : "mt-5"}>
                  <MessageRow
                    message={message}
                    grouped={grouped}
                    interactive={isSignedIn}
                    onToggleReaction={toggleReaction}
                    onCreateTask={(message) => {
                      const title = message.body.trim().slice(0, 100);
                      const description = conversation?.name
                        ? `From ${conversation.name}:\n\n${message.body}`
                        : message.body;
                      navigate(
                        `/tasks?draft=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`,
                      );
                      notify("Opening task composer");
                    }}
                  />
                </div>
              </Fragment>
            );
          })
        )}
      </div>

      {isSignedIn ? (
        <Composer
          conversationId={conversationId}
          draft={draft}
          onDraftChange={setDraft}
          onSend={appendMessage}
          onReplace={replaceMessage}
          onFailed={failMessage}
        />
      ) : (
        <div className="border-t border-[#eff0f3] px-5 py-4 text-center text-[12px] text-[#9299a8]">
          Sign in to send messages
        </div>
      )}

      {activeCallId ? (
        <CallPanel
          callId={activeCallId}
          onClose={() => setActiveCallId(null)}
          onNotify={notify}
        />
      ) : null}
    </div>
  );
}

function MessageRow({
  message,
  interactive,
  grouped,
  onToggleReaction,
  onCreateTask,
}: {
  message: ChatMessage;
  interactive: boolean;
  grouped: boolean;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onCreateTask: (message: ChatMessage) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const smileRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pickerRef.current?.contains(target)) return;
      if (smileRef.current?.contains(target)) return;
      setPickerOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerOpen]);

  return (
    <div className="group relative flex gap-3">
      {grouped ? (
        <span className="w-8 shrink-0" aria-hidden="true" />
      ) : (
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-[#31518e]"
          style={{ backgroundColor: message.sender.color }}
        >
          {message.sender.initials}
        </span>
      )}
      <div className="min-w-0 flex-1">
        {!grouped ? (
          <p className="text-[12px] font-semibold text-[#414a5d]">
            {message.sender.name}{" "}
            <span className="ml-1 font-normal text-[#a0a6b2]">
              {formatTime(message.createdAt)}
            </span>
          </p>
        ) : null}
        <p
          className={cn(
            "max-w-xl whitespace-pre-wrap text-[13px] leading-5 text-[#6f7889]",
            !grouped && "mt-1",
          )}
        >
          {message.body}
        </p>
        {interactive && message.reactions.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {message.reactions.map((reaction) => (
              <button
                type="button"
                key={reaction.emoji}
                onClick={() => onToggleReaction(message.id, reaction.emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] transition-colors",
                  reaction.reactedByMe
                    ? "border-[#c7cbe8] bg-[#eef0ff] text-[#535dc9]"
                    : "border-[#e5e7ec] bg-white text-[#697184] hover:border-[#c7cbe8]",
                )}
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.userIds.length}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {interactive ? (
        <div className="absolute -top-1 right-0 hidden items-center gap-0.5 group-hover:flex">
          <button
            type="button"
            aria-label="Create task from message"
            title="Create task from message"
            className="rounded-md p-1 text-[#9aa1ad] transition-colors hover:bg-[#f2f3f6] hover:text-[#535dc9]"
            onClick={() => onCreateTask(message)}
          >
            <Bulletlist className="size-3.5" />
          </button>
          <button
            ref={smileRef}
            type="button"
            aria-label="Add reaction"
            aria-expanded={pickerOpen}
            className="rounded-md p-1 text-[#9aa1ad] transition-colors hover:bg-[#f2f3f6] hover:text-[#535dc9]"
            onClick={() => setPickerOpen((open) => !open)}
          >
            <Smile className="size-3.5" />
          </button>
        </div>
      ) : null}
      {pickerOpen ? (
        <div
          ref={pickerRef}
          className="absolute right-0 top-6 z-10 flex items-center gap-0.5 rounded-lg border border-[#e3e5ea] bg-white p-1 shadow-[0_12px_30px_rgba(35,43,66,0.13)]"
        >
          {EMOJI_PALETTE.map((emoji) => (
            <button
              type="button"
              key={emoji}
              aria-label={`React with ${emoji}`}
              className="rounded-md px-1.5 py-1 text-[14px] transition-colors hover:bg-[#f5f6f8]"
              onClick={() => {
                onToggleReaction(message.id, emoji);
                setPickerOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function DaySeparator({ timestamp }: { timestamp: number }) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  let label: string;
  if (sameCalendarDay(date, today)) label = "Today";
  else if (sameCalendarDay(date, yesterday)) label = "Yesterday";
  else
    label = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  return (
    <div className="mx-auto w-fit rounded-full bg-[#f1f2f6] px-2.5 py-1 text-[10px] font-medium text-[#9aa1ad]">
      {label}
    </div>
  );
}

function findPendingByBody(
  pending: Map<string, string>,
  body: string,
): string | undefined {
  for (const [clientId, pendingBody] of pending.entries()) {
    if (pendingBody === body) return clientId;
  }
  return undefined;
}

function mergeMessages(
  first: ChatMessage[],
  second: ChatMessage[],
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const current of first) byId.set(current.id, current);
  for (const current of second) byId.set(current.id, current);
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt);
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function MessageSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex gap-3">
          <span className="size-8 shrink-0 animate-pulse rounded-full bg-[#eff0f3]" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-32 animate-pulse rounded-md bg-[#f0f1f4]" />
            <div className="h-3 w-3/4 animate-pulse rounded-md bg-[#f3f4f7]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Thread };

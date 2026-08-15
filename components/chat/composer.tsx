"use client";

import { Send } from "lucide-react";
import { useEffect, useRef } from "react";
import { sendMessageRest } from "@/components/chat/chat-api";
import {
  isSocketConnected,
  sendChatMessage,
  sendTyping,
} from "@/components/chat/chat-socket";
import { getInitials, useShell } from "@/components/shell/shell-context";
import type { ChatMessage } from "@/lib/chat-types";

function Composer({
  conversationId,
  draft,
  onDraftChange,
  onSend,
  onReplace,
  onFailed,
}: {
  conversationId: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: (temporary: ChatMessage) => void;
  onReplace: (clientId: string, message: ChatMessage) => void;
  onFailed: (clientId: string, body: string) => void;
}) {
  const { userName } = useShell();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sentTypingRef = useRef(false);
  const typingTimerRef = useRef<number | undefined>(undefined);

  const stopTyping = () => {
    window.clearTimeout(typingTimerRef.current);
    if (!sentTypingRef.current) return;
    sentTypingRef.current = false;
    sendTyping({ conversationId, isTyping: false });
  };

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 96)}px`;
  });

  useEffect(() => {
    return () => {
      window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    onDraftChange(value);
    if (!isSocketConnected()) return;
    if (!value) {
      if (sentTypingRef.current) {
        sentTypingRef.current = false;
        window.clearTimeout(typingTimerRef.current);
        sendTyping({ conversationId, isTyping: false });
      }
      return;
    }
    if (!sentTypingRef.current) {
      sentTypingRef.current = true;
      sendTyping({ conversationId, isTyping: true });
    }
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      sentTypingRef.current = false;
      sendTyping({ conversationId, isTyping: false });
    }, 2500);
  };

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    const temporary: ChatMessage = {
      id: crypto.randomUUID(),
      conversationId,
      sender: {
        id: "me",
        name: userName,
        initials: getInitials(userName),
        color: "#d9d6f4",
      },
      body,
      createdAt: Date.now(),
      reactions: [],
    };
    onSend(temporary);
    stopTyping();
    if (isSocketConnected()) {
      sendChatMessage({ conversationId, body, clientId: temporary.id });
      return;
    }
    sendMessageRest({ conversationId, body, clientId: temporary.id })
      .then((response) => onReplace(temporary.id, response.message))
      .catch(() => onFailed(temporary.id, body));
  };

  return (
    <div className="m-4 flex items-end gap-2 rounded-xl border border-[#e5e7ec] px-3 py-2 focus-within:border-[#c7cbe0]">
      <textarea
        ref={textareaRef}
        rows={1}
        aria-label="Write a message"
        className="max-h-24 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-1 text-[13px] outline-none placeholder:text-[#a1a8b5]"
        placeholder="Write a message..."
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        onBlur={stopTyping}
      />
      <span className="hidden shrink-0 pb-1.5 text-[10px] text-[#a1a8b5] sm:block">
        Enter ↵
      </span>
      <button
        type="button"
        aria-label="Send message"
        title="Send message (Enter)"
        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#5b64d6] text-white transition-opacity hover:bg-[#4e57c5] disabled:opacity-40 disabled:hover:bg-[#5b64d6]"
        disabled={!draft.trim()}
        onClick={handleSend}
      >
        <Send className="size-3.5" />
      </button>
    </div>
  );
}

export { Composer };

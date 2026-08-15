"use client";

import { useEffect, useState } from "react";
import { fetchConversations } from "@/components/chat/chat-api";
import { getChatSocket, onServerEvent } from "@/components/chat/chat-socket";
import { useShell } from "@/components/shell/shell-context";
import type { ConversationSummary } from "@/lib/chat-types";

export function useConversationList() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let polling: number | undefined;

    const load = async () => {
      try {
        const data = await fetchConversations();
        if (cancelled) return;
        setConversations(data.conversations);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load conversations",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const startPolling = () => {
      if (polling === undefined) {
        polling = window.setInterval(() => {
          load();
        }, 5000);
      }
    };
    const stopPolling = () => {
      if (polling !== undefined) {
        window.clearInterval(polling);
        polling = undefined;
      }
    };
    const onLocalChange = () => {
      load();
    };
    window.addEventListener("chat:local-change", onLocalChange);

    const socket = getChatSocket();
    const unsubscribe = onServerEvent((event) => {
      if (event.type === "conversations:changed") load();
    });
    const onConnect = () => {
      stopPolling();
      load();
    };
    const onDisconnect = () => startPolling();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    load();
    if (!socket.connected) startPolling();

    return () => {
      cancelled = true;
      stopPolling();
      window.removeEventListener("chat:local-change", onLocalChange);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      unsubscribe();
    };
  }, []);

  return { conversations, loading, error };
}

export function useUnreadSync(conversations: ConversationSummary[]): void {
  const { setUnread } = useShell();

  useEffect(() => {
    const total = conversations.reduce(
      (sum, conversation) => sum + conversation.unreadCount,
      0,
    );
    setUnread((prev) => {
      const next = total > 0;
      if (prev.messages === next) return prev;
      return { ...prev, messages: next };
    });
  }, [conversations, setUnread]);
}

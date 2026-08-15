"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  useConversationList,
  useUnreadSync,
} from "@/components/chat/chat-hooks";
import { ConversationList } from "@/components/chat/conversation-list";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { conversations, loading } = useConversationList();
  useUnreadSync(conversations);
  const pathname = usePathname();
  const [showNewConversation, setShowNewConversation] = useState(false);
  const threadOpen = pathname !== "/messages";

  return (
    <>
      <div className="grid h-full min-h-0 w-full gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className={threadOpen ? "hidden min-h-0 lg:block" : "min-h-0"}>
          <ConversationList
            conversations={conversations}
            loading={loading}
            onNewMessage={() => setShowNewConversation(true)}
          />
        </div>
        <div className={threadOpen ? "min-h-0" : "hidden min-h-0 lg:block"}>
          {children}
        </div>
      </div>
      {showNewConversation ? (
        <NewConversationDialog onClose={() => setShowNewConversation(false)} />
      ) : null}
    </>
  );
}

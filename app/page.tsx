"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ChatView } from "@/components/views/chat-view";
import { ImageGallery } from "@/components/views/image-gallery";
import { FileFolder } from "@/components/views/file-folder";
import { mockConversations, mockDirectConversations, mockGroupConversations } from "@/lib/data";
import type { Conversation } from "@/lib/types";

export default function HomePage() {
  const [activeView, setActiveView] = useState<"chat" | "gallery" | "files">("chat");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    mockConversations[0]?.id || null
  );

  const handleViewChange = (view: "chat" | "gallery" | "files") => {
    setActiveView(view);
  };

  const handleConversationSelect = (id: string) => {
    setActiveConversationId(id);
  };

  const handleNewConversation = () => {
    // In a real app, this would open a dialog to start a new conversation
    console.log("New conversation");
  };

  const activeConversation = activeConversationId
    ? mockConversations.find((c) => c.id === activeConversationId) || null
    : null;

  const renderContent = () => {
    switch (activeView) {
      case "chat":
        return (
          <ChatView
            conversation={activeConversation}
            currentUserId="current-user"
          />
        );
      case "gallery":
        return <ImageGallery onUpload={() => console.log("Upload image")} />;
      case "files":
        return <FileFolder onUpload={() => console.log("Upload file")} />;
      default:
        return null;
    }
  };

  return (
    <MainLayout
      conversations={mockConversations}
      activeConversationId={activeConversationId}
      onConversationSelect={handleConversationSelect}
      onNewConversation={handleNewConversation}
      activeView={activeView}
      onViewChange={handleViewChange}
    >
      {renderContent()}
    </MainLayout>
  );
}

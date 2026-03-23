export type ConversationType = "direct" | "group";
export type ConversationStatus = "open" | "in_progress" | "resolved" | "pending";

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string;
  avatar?: string;
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderId: string;
  };
  unreadCount: number;
  status: ConversationStatus;
  isPinned?: boolean;
  updatedAt: Date;
}

export interface DirectConversation extends Conversation {
  type: "direct";
  otherUserId: string;
}

export interface GroupConversation extends Conversation {
  type: "group";
  memberCount: number;
  description?: string;
}

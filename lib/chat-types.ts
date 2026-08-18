type ConversationType = "dm" | "channel" | "group";

export type AvatarUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export type MessageReaction = {
  emoji: string;
  userIds: string[];
  reactedByMe: boolean;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  sender: AvatarUser;
  body: string;
  createdAt: number;
  reactions: MessageReaction[];
};

export type ConversationSummary = {
  id: string;
  type: ConversationType;
  name: string;
  topic: string | null;
  members: AvatarUser[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: number;
};

export type ConversationsResponse = {
  conversations: ConversationSummary[];
  isPreview: boolean;
};

export type MessagesResponse = {
  messages: ChatMessage[];
  hasMore: boolean;
  nextBefore: number | null;
};

export type SendMessageInput = {
  conversationId: string;
  body: string;
  clientId: string;
};

export type SendMessageResponse = {
  message: ChatMessage;
};

export type CreateDmInput = {
  userId: string;
};

export type CreateDmResponse = {
  conversationId: string;
};

export type CreateGroupInput = {
  userIds: string[];
  name?: string;
  topic?: string;
};

export type CreateGroupResponse = {
  conversationId: string;
};

export type ToggleReactionInput = {
  emoji: string;
};

export type ToggleReactionResponse = {
  messageId: string;
  reactions: MessageReaction[];
};

export type UsersResponse = {
  users: AvatarUser[];
};

export type ServerEvent =
  | { type: "message:new"; payload: ChatMessage }
  | {
      type: "message:sent";
      payload: { clientId: string; message: ChatMessage };
    }
  | {
      type: "message:failed";
      payload: { clientId: string; conversationId: string; reason: string };
    }
  | {
      type: "reaction:update";
      payload: {
        conversationId: string;
        messageId: string;
        reactions: MessageReaction[];
      };
    }
  | {
      type: "typing";
      payload: { conversationId: string; userId: string; name: string };
    }
  | { type: "conversations:changed"; payload: Record<string, never> };

export const MAX_MESSAGE_LENGTH = 4000;

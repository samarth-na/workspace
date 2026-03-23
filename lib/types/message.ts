export type MessageType = "text" | "image" | "file" | "system";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  edited?: boolean;
  replyTo?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  type: "image" | "file";
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface ActivityItem {
  id: string;
  conversationId: string;
  type: "status_change" | "assignment" | "tag_added" | "note_added";
  actorId: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, string>;
}

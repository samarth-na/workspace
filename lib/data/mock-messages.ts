import type { Message, ActivityItem } from "@/lib/types/message";

export const mockMessages: Record<string, Message[]> = {
  "conv-direct-1": [
    {
      id: "msg-1-1",
      conversationId: "conv-direct-1",
      senderId: "user-1",
      content: "Hey! How's it going?",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
      id: "msg-1-2",
      conversationId: "conv-direct-1",
      senderId: "current-user",
      content: "I'm good! Working on the new feature. You?",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.9),
    },
    {
      id: "msg-1-3",
      conversationId: "conv-direct-1",
      senderId: "user-1",
      content: "Same here. Just finished the design mockups!",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    },
    {
      id: "msg-1-4",
      conversationId: "conv-direct-1",
      senderId: "user-1",
      content: "Want to see them?",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.4),
    },
    {
      id: "msg-1-5",
      conversationId: "conv-direct-1",
      senderId: "current-user",
      content: "Absolutely! Send them over",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: "msg-1-6",
      conversationId: "conv-direct-1",
      senderId: "user-1",
      content: "Hey, did you see the new designs?",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ],
  "conv-direct-2": [
    {
      id: "msg-2-1",
      conversationId: "conv-direct-2",
      senderId: "user-2",
      content: "Quick question about the API",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: "msg-2-2",
      conversationId: "conv-direct-2",
      senderId: "current-user",
      content: "Sure, what's up?",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 55),
    },
    {
      id: "msg-2-3",
      conversationId: "conv-direct-2",
      senderId: "user-2",
      content: "The API integration is done!",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
  ],
  "conv-group-1": [
    {
      id: "msg-g1-1",
      conversationId: "conv-group-1",
      senderId: "user-2",
      content: "Morning team! Ready for the deploy?",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: "msg-g1-2",
      conversationId: "conv-group-1",
      senderId: "user-5",
      content: "Ready when you are!",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 50),
    },
    {
      id: "msg-g1-3",
      conversationId: "conv-group-1",
      senderId: "user-3",
      content: "All tests are passing ✅",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
      id: "msg-g1-4",
      conversationId: "conv-group-1",
      senderId: "user-1",
      content: "Deploy is going live now! 🚀",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
    },
  ],
  "conv-group-3": [
    {
      id: "msg-g3-1",
      conversationId: "conv-group-3",
      senderId: "user-7",
      content: "Update on the launch timeline",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
      id: "msg-g3-2",
      conversationId: "conv-group-3",
      senderId: "user-4",
      content: "We're on track for next week",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 11),
    },
    {
      id: "msg-g3-3",
      conversationId: "conv-group-3",
      senderId: "user-7",
      content: "Marketing materials are ready",
      type: "text",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    },
  ],
};

export const mockActivities: Record<string, ActivityItem[]> = {
  "conv-direct-1": [
    {
      id: "act-1-1",
      conversationId: "conv-direct-1",
      type: "status_change",
      actorId: "user-1",
      description: "changed status to In Progress",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      metadata: { from: "Open", to: "In Progress" },
    },
    {
      id: "act-1-2",
      conversationId: "conv-direct-1",
      type: "assignment",
      actorId: "user-1",
      description: "assigned to Sarah Chen",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    },
  ],
  "conv-direct-2": [
    {
      id: "act-2-1",
      conversationId: "conv-direct-2",
      type: "status_change",
      actorId: "current-user",
      description: "marked as resolved",
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      metadata: { from: "In Progress", to: "Resolved" },
    },
  ],
};

export const getMessagesForConversation = (conversationId: string): Message[] => {
  return mockMessages[conversationId] || [];
};

export const getActivitiesForConversation = (conversationId: string): ActivityItem[] => {
  return mockActivities[conversationId] || [];
};

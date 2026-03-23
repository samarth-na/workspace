import type { DirectConversation, GroupConversation } from "@/lib/types/conversation";

export const mockDirectConversations: DirectConversation[] = [
  {
    id: "conv-direct-1",
    type: "direct",
    name: "Sarah Chen",
    avatar: "/scenarys/alex-gruber-z_IL2jBFsqM-unsplash.jpg",
    otherUserId: "user-1",
    participants: ["current-user", "user-1"],
    lastMessage: {
      content: "Hey, did you see the new designs?",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      senderId: "user-1",
    },
    unreadCount: 2,
    status: "open",
    isPinned: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "conv-direct-2",
    type: "direct",
    name: "Alex Rivera",
    avatar: "/scenarys/alex-shutin-kKvQJ6rK6S4-unsplash.jpg",
    otherUserId: "user-2",
    participants: ["current-user", "user-2"],
    lastMessage: {
      content: "The API integration is done!",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      senderId: "user-2",
    },
    unreadCount: 0,
    status: "in_progress",
    updatedAt: new Date(Date.now() - 1000 * 60 * 30),
  },
  {
    id: "conv-direct-3",
    type: "direct",
    name: "Jordan Park",
    avatar: "/scenarys/ali-kazal-2mg-3crJFgk-unsplash.jpg",
    otherUserId: "user-3",
    participants: ["current-user", "user-3"],
    lastMessage: {
      content: "Thanks for the feedback!",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      senderId: "current-user",
    },
    unreadCount: 0,
    status: "resolved",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "conv-direct-4",
    type: "direct",
    name: "Emma Wilson",
    avatar: "/scenarys/aniket-deole-T-tOgjWZ0fQ-unsplash.jpg",
    otherUserId: "user-4",
    participants: ["current-user", "user-4"],
    lastMessage: {
      content: "Meeting at 3pm tomorrow?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
      senderId: "user-4",
    },
    unreadCount: 1,
    status: "open",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
  },
  {
    id: "conv-direct-5",
    type: "direct",
    name: "Michael Brown",
    avatar: "/scenarys/aron-visuals-LSFuPFE9vKE-unsplash.jpg",
    otherUserId: "user-5",
    participants: ["current-user", "user-5"],
    lastMessage: {
      content: "Can you review this PR?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      senderId: "user-5",
    },
    unreadCount: 0,
    status: "pending",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

export const mockGroupConversations: GroupConversation[] = [
  {
    id: "conv-group-1",
    type: "group",
    name: "Engineering Team",
    avatar: "/scenarys/beautiful-yosemite-8k-r7.jpg",
    participants: ["current-user", "user-1", "user-2", "user-3", "user-5"],
    memberCount: 5,
    description: "Daily engineering discussions and updates",
    lastMessage: {
      content: "Sarah: Deploy is going live now! 🚀",
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
      senderId: "user-1",
    },
    unreadCount: 5,
    status: "in_progress",
    isPinned: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: "conv-group-2",
    type: "group",
    name: "Design Review",
    avatar: "/scenarys/daniele-buso-qzUenL35ZYw-unsplash.jpg",
    participants: ["current-user", "user-1", "user-4", "user-6"],
    memberCount: 4,
    description: "Weekly design reviews and feedback",
    lastMessage: {
      content: "Emma: Here are the mockups for v2",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
      senderId: "user-4",
    },
    unreadCount: 0,
    status: "open",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: "conv-group-3",
    type: "group",
    name: "Product Launch",
    avatar: "/scenarys/david-becker-58X3XfxxevU-unsplash.jpg",
    participants: ["current-user", "user-1", "user-2", "user-4", "user-7", "user-8"],
    memberCount: 6,
    description: "Coordination for upcoming product launch",
    lastMessage: {
      content: "David: Marketing materials are ready",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
      senderId: "user-7",
    },
    unreadCount: 12,
    status: "in_progress",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
  },
  {
    id: "conv-group-4",
    type: "group",
    name: "Random Chat",
    avatar: "/scenarys/engjell-gjepali-M0OIyN5u8ZM-unsplash.jpg",
    participants: ["current-user", "user-3", "user-6", "user-8"],
    memberCount: 4,
    description: "Off-topic conversations and fun",
    lastMessage: {
      content: "Rachel: Anyone up for lunch?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
      senderId: "user-8",
    },
    unreadCount: 0,
    status: "open",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
  },
];

export const mockConversations = [...mockDirectConversations, ...mockGroupConversations];

export const getConversationById = (id: string) => {
  return mockConversations.find((conv) => conv.id === id);
};

export const getDirectConversations = () => mockDirectConversations;
export const getGroupConversations = () => mockGroupConversations;

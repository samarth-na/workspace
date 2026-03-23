import type { User } from "@/lib/types/user";

export const currentUser: User = {
  id: "current-user",
  name: "You",
  email: "you@workspace.com",
  avatar: "/scenarys/Default.jpg",
  status: "online",
  color: "#3b82f6",
  initials: "YO",
};

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Sarah Chen",
    email: "sarah@workspace.com",
    avatar: "/scenarys/alex-gruber-z_IL2jBFsqM-unsplash.jpg",
    status: "online",
    color: "#ec4899",
    initials: "SC",
  },
  {
    id: "user-2",
    name: "Alex Rivera",
    email: "alex@workspace.com",
    avatar: "/scenarys/alex-shutin-kKvQJ6rK6S4-unsplash.jpg",
    status: "busy",
    color: "#f97316",
    initials: "AR",
  },
  {
    id: "user-3",
    name: "Jordan Park",
    email: "jordan@workspace.com",
    avatar: "/scenarys/ali-kazal-2mg-3crJFgk-unsplash.jpg",
    status: "offline",
    color: "#8b5cf6",
    initials: "JP",
  },
  {
    id: "user-4",
    name: "Emma Wilson",
    email: "emma@workspace.com",
    avatar: "/scenarys/aniket-deole-T-tOgjWZ0fQ-unsplash.jpg",
    status: "online",
    color: "#10b981",
    initials: "EW",
  },
  {
    id: "user-5",
    name: "Michael Brown",
    email: "michael@workspace.com",
    avatar: "/scenarys/aron-visuals-LSFuPFE9vKE-unsplash.jpg",
    status: "away",
    color: "#f59e0b",
    initials: "MB",
  },
  {
    id: "user-6",
    name: "Lisa Anderson",
    email: "lisa@workspace.com",
    avatar: "/scenarys/ashwini-chaudhary-monty-fgm3VWev8UY-unsplash.jpg",
    status: "online",
    color: "#06b6d4",
    initials: "LA",
  },
  {
    id: "user-7",
    name: "David Kim",
    email: "david@workspace.com",
    avatar: "/scenarys/changyoung-koh-TE4UfPCZhz8-unsplash.jpg",
    status: "busy",
    color: "#ef4444",
    initials: "DK",
  },
  {
    id: "user-8",
    name: "Rachel Green",
    email: "rachel@workspace.com",
    avatar: "/scenarys/dan-gold-Uuh0K9YtNM8-unsplash.jpg",
    status: "online",
    color: "#84cc16",
    initials: "RG",
  },
];

export const getUserById = (id: string): User | undefined => {
  if (id === currentUser.id) return currentUser;
  return mockUsers.find((user) => user.id === id);
};

export const getOnlineUsers = (): User[] => {
  return mockUsers.filter((user) => user.status === "online");
};

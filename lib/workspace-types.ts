import type { AvatarUser } from "@/lib/chat-types";

export type WorkspaceRole = "admin" | "member";

export type WorkspaceContext = {
  workspaceId: string;
  workspaceName: string;
  workspaceLogo: string | null;
  role: WorkspaceRole;
  isAdmin: boolean;
};

export type WorkspaceMemberItem = AvatarUser & {
  email: string;
  role: WorkspaceRole;
  joinedAt: number;
};

export type WorkspaceResponse = {
  workspace: {
    id: string;
    name: string;
    logo: string | null;
    createdAt: number;
  };
  me: {
    role: WorkspaceRole;
    isAdmin: boolean;
  };
  members: WorkspaceMemberItem[];
};

export type UpdateWorkspaceInput = {
  name?: string;
  logo?: string | null;
};

export type InviteMemberInput = {
  email: string;
};

export type UpdateMemberInput = {
  userId: string;
  role: WorkspaceRole;
};

export type RemoveMemberInput = {
  userId: string;
};

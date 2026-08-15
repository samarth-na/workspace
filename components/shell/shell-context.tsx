"use client";

import { createContext, useContext } from "react";

export type ShellContextValue = {
  userName: string;
  userImage: string | null;
  isSignedIn: boolean;
  workspaceName: string;
  workspaceLogo: string | null;
  isWorkspaceAdmin: boolean;
  notify: (message: string) => void;
  navigate: (href: string) => void;
  unread: { messages: boolean };
  setUnread: (
    updater: (prev: { messages: boolean }) => { messages: boolean },
  ) => void;
  openSearch: () => void;
  openCreate: () => void;
  toggleProfile: () => void;
};

export const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell() {
  const context = useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within ShellContext.Provider");
  }
  return context;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

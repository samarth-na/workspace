export type UserStatus = "online" | "offline" | "busy" | "away";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  color: string;
  initials: string;
}

export interface CurrentUser extends User {
  isCurrentUser: true;
}

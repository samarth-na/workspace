import type { UserStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  status: UserStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusColors: Record<UserStatus, string> = {
  online: "bg-status-online",
  busy: "bg-status-busy",
  away: "bg-status-away",
  offline: "bg-status-offline",
};

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

export function StatusIndicator({ status, size = "md", className }: StatusIndicatorProps) {
  return (
    <span
      className={cn(
        "rounded-full border-2 border-background",
        statusColors[status],
        sizeClasses[size],
        status === "online" && "status-dot-online",
        className
      )}
    />
  );
}

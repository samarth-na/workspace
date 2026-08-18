import type { TaskPriority, TaskStatus } from "@/lib/task-types";

export const STATUS_ORDER: TaskStatus[] = [
  "backlog",
  "todo",
  "in-progress",
  "in-review",
  "done",
];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; text: string; bg: string; dot: string }
> = {
  backlog: {
    label: "Backlog",
    text: "text-[#8a8f9a]",
    bg: "bg-[#f1f1f3]",
    dot: "bg-[#b8bcc6]",
  },
  todo: {
    label: "Todo",
    text: "text-[#5d6677]",
    bg: "bg-[#f1f2f5]",
    dot: "bg-[#8f97a8]",
  },
  "in-progress": {
    label: "In progress",
    text: "text-[#31518e]",
    bg: "bg-[#e2e9f7]",
    dot: "bg-[#5b64d6]",
  },
  "in-review": {
    label: "In review",
    text: "text-[#805a51]",
    bg: "bg-[#f8e9e3]",
    dot: "bg-[#d97757]",
  },
  done: {
    label: "Done",
    text: "text-[#3d7a5a]",
    bg: "bg-[#e2f1e7]",
    dot: "bg-[#4caf7d]",
  },
};

export const PRIORITY_ORDER: TaskPriority[] = [
  "urgent",
  "high",
  "medium",
  "low",
  "none",
];

export const PRIORITY_META: Record<
  TaskPriority,
  { label: string; rank: number }
> = {
  urgent: { label: "Urgent", rank: 0 },
  high: { label: "High", rank: 1 },
  medium: { label: "Medium", rank: 2 },
  low: { label: "Low", rank: 3 },
  none: { label: "None", rank: 4 },
};

export const PROJECT_COLORS = [
  "#5b64d6",
  "#d97757",
  "#4caf7d",
  "#c2913c",
  "#3f60d9",
  "#e05d8a",
];

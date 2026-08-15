"use client";

import { ViewFrame } from "@/components/shared/view-frame";
import { useShell } from "@/components/shell/shell-context";
import { cn } from "@/lib/utils";

const inboxItems = [
  {
    title: "Maya mentioned you in Product launch",
    detail: "Can you review the final onboarding flow before Friday?",
    time: "12 min ago",
    color: "bg-[#f5c7b8]",
    initials: "MC",
    unread: true,
    href: "/messages",
  },
  {
    title: "Jordan shared Q3 product brief",
    detail: "Q3 product brief · 2.4 MB",
    time: "1 hr ago",
    color: "bg-[#c6d8f5]",
    initials: "JL",
    unread: true,
    href: "/files",
  },
  {
    title: "You were added to Design critique",
    detail: "Tomorrow at 1:00 PM",
    time: "Yesterday",
    color: "bg-[#ddd0f3]",
    initials: "PS",
    href: "/calls",
  },
  {
    title: "Priya reacted to your message",
    detail: "That direction feels right for the launch.",
    time: "Yesterday",
    color: "bg-[#d4e8cf]",
    initials: "PS",
    href: "/messages",
  },
];

function InboxView() {
  const { notify, navigate } = useShell();
  return (
    <ViewFrame
      title="Inbox"
      description="Updates and mentions that need your attention."
      action="Mark all read"
      onAction={() => notify("Inbox marked as read")}
    >
      <div className="max-w-3xl overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
        {inboxItems.map((item) => (
          <Notification
            key={item.title}
            title={item.title}
            detail={item.detail}
            time={item.time}
            color={item.color}
            initials={item.initials}
            unread={item.unread}
            onClick={() => navigate(item.href)}
          />
        ))}
      </div>
    </ViewFrame>
  );
}

function Notification({
  title,
  detail,
  time,
  color,
  initials,
  unread = false,
  onClick,
}: {
  title: string;
  detail: string;
  time: string;
  color: string;
  initials: string;
  unread?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 border-b border-[#eff0f3] px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-[#fafaff]"
      onClick={onClick}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[#514e9a]",
          color,
        )}
      >
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[#414a5d]">
          {title}
          {unread ? (
            <span className="ml-2 inline-block size-1.5 rounded-full bg-[#6873dc] align-middle" />
          ) : null}
        </span>
        <span className="mt-1 block truncate text-[12px] text-[#9299a8]">
          {detail}
        </span>
      </span>
      <span className="shrink-0 text-[11px] text-[#a0a6b2]">{time}</span>
    </button>
  );
}

export { InboxView };

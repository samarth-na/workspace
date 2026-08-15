"use client";

import { useEffect, useState } from "react";
import { fetchMeetings } from "@/components/meetings/meeting-api";
import type { MeetingSummary } from "@/lib/meeting-types";

function MeetingSidebarItem({
  onOpen,
  mobile = false,
}: {
  onOpen: (href: string) => void;
  mobile?: boolean;
}) {
  const [meeting, setMeeting] = useState<MeetingSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMeetings();
        if (cancelled) return;
        setMeeting(
          data.meetings.find((entry) => entry.status === "live") ?? null,
        );
      } catch {
        // sidebar stays quiet if meetings cannot load
      }
    };
    load();
    const timer = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!meeting) return null;

  return (
    <button
      type="button"
      className={
        mobile
          ? "mt-3 flex w-full items-center gap-3 rounded-lg px-1.5 py-2 text-left hover:bg-white/60"
          : "mt-3 flex w-full items-center gap-3 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/60"
      }
      onClick={() => onOpen(`/meeting/${meeting.id}`)}
    >
      <span className="size-3 rounded-[3px] bg-[#67bd8b]" />
      <span
        className={
          mobile
            ? "flex-1 truncate text-[14px] text-[#2e2e31]"
            : "flex-1 truncate text-[13px] text-[#2e2e31]"
        }
      >
        {meeting.title}
      </span>
      <span
        className={
          mobile ? "text-[12px] text-[#45454a]" : "text-[11px] text-[#45454a]"
        }
      >
        Live
      </span>
    </button>
  );
}

export { MeetingSidebarItem };

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
    fetchMeetings()
      .then((data) => {
        if (cancelled) return;
        const now = Date.now();
        const live = data.meetings.find((entry) => entry.status === "live");
        const next = data.meetings
          .filter(
            (entry) => entry.status === "scheduled" && entry.startsAt > now,
          )
          .sort((a, b) => a.startsAt - b.startsAt)[0];
        setMeeting(live ?? next ?? null);
      })
      .catch(() => {
        // sidebar stays quiet if meetings cannot load
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!meeting) return null;

  const timeLabel =
    meeting.status === "live"
      ? "Live"
      : new Date(meeting.startsAt).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        });

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
      <span
        className={
          meeting.status === "live"
            ? "size-3 rounded-[3px] bg-[#67bd8b]"
            : "size-3 rounded-[3px] bg-[#9aa1ad]"
        }
      />
      <span
        className={
          mobile
            ? "flex-1 truncate text-[14px] text-[#5d5d60]"
            : "flex-1 truncate text-[13px] text-[#606064]"
        }
      >
        {meeting.title}
      </span>
      <span
        className={
          mobile
            ? "text-[12px] text-[#99999b]"
            : "text-[11px] text-[#969699]"
        }
      >
        {timeLabel}
      </span>
    </button>
  );
}

export { MeetingSidebarItem };

"use client";

import { useRouter } from "next/navigation";
import {
  CalendarRange,
  Clock,
  ExternalLink,
  Loader,
  MoreVertical,
  Phone,
  Video,
} from "pixelarticons/react";
import { useEffect, useState } from "react";
import { endMeeting, fetchMeetings } from "@/components/meetings/meeting-api";
import { NewMeetingDialog } from "@/components/meetings/new-meeting-dialog";
import { ViewFrame } from "@/components/shared/view-frame";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import type { AvatarUser } from "@/lib/chat-types";
import type { MeetingSummary } from "@/lib/meeting-types";

function CallsView() {
  const { notify } = useShell();
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMeetings();
        if (cancelled) return;
        setMeetings(data.meetings);
        setIsAdmin(data.isAdmin);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load calls");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const timer = window.setInterval(load, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const now = Date.now();
  const live = meetings.filter(
    (meeting) =>
      meeting.status === "live" ||
      (meeting.status === "scheduled" && meeting.startsAt <= now),
  );
  const upcoming = meetings
    .filter(
      (meeting) => meeting.status === "scheduled" && meeting.startsAt > now,
    )
    .sort((a, b) => a.startsAt - b.startsAt);
  const recent = meetings
    .filter((meeting) => meeting.status === "ended")
    .sort((a, b) => (b.endsAt ?? 0) - (a.endsAt ?? 0));

  const join = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`);
  };

  const end = async (meetingId: string) => {
    if (pendingEnd) return;
    setPendingEnd(meetingId);
    try {
      const response = await endMeeting(meetingId);
      setMeetings((prev) =>
        prev.map((entry) =>
          entry.id === meetingId ? response.meeting : entry,
        ),
      );
      notify("Meeting ended");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not end meeting");
    } finally {
      setPendingEnd(null);
    }
  };

  return (
    <ViewFrame
      title="Calls"
      description="Start a focused room or pick up where your team left off."
      action="New meeting"
      onAction={() => setShowNewMeeting(true)}
    >
      {error ? (
        <p className="text-[13px] text-[#dc3d43]" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader className="size-5 animate-spin text-[#8b94a5]" />
        </div>
      ) : (
        <div className="grid max-w-5xl gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <section>
              <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8b94a5]">
                <span className="size-1.5 rounded-full bg-[#4ade80]" />
                Live now
              </h2>
              {live.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e3e5ea] bg-white p-6 text-center">
                  <p className="text-[13px] text-[#788193]">
                    No calls are live right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {live.map((meeting) => (
                    <LiveMeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      canEnd={isAdmin || meeting.isHost}
                      busy={pendingEnd === meeting.id}
                      onJoin={() => join(meeting.id)}
                      onEnd={() => void end(meeting.id)}
                      onMenu={() => notify("Meeting options opened")}
                    />
                  ))}
                </div>
              )}
            </section>
            <section>
              <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8b94a5]">
                <CalendarRange className="size-3" />
                Upcoming
              </h2>
              {upcoming.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#e3e5ea] bg-white p-6 text-center text-[13px] text-[#788193]">
                  Nothing scheduled. Start a meeting to get everyone together.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white">
                  {upcoming.map((meeting) => (
                    <MeetingRow
                      key={meeting.id}
                      meeting={meeting}
                      onAction={() => join(meeting.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
          <section>
            <div className="rounded-2xl border border-[#e5e7ec] bg-white p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-[#3d4658]">
                  Recent calls
                </h3>
                <Clock className="size-4 text-[#9aa1ad]" />
              </div>
              <div className="mt-4 divide-y divide-[#eff0f3]">
                {recent.length === 0 ? (
                  <p className="py-4 text-center text-[12px] text-[#9aa1ad]">
                    No recent calls yet.
                  </p>
                ) : (
                  recent.map((meeting) => (
                    <RecentCallRow
                      key={meeting.id}
                      meeting={meeting}
                      onAction={() => notify(`Calling ${meeting.title}`)}
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {showNewMeeting ? (
        <NewMeetingDialog
          onClose={() => setShowNewMeeting(false)}
          onNotify={notify}
        />
      ) : null}
    </ViewFrame>
  );
}

function LiveMeetingCard({
  meeting,
  canEnd,
  busy,
  onJoin,
  onEnd,
  onMenu,
}: {
  meeting: MeetingSummary;
  canEnd: boolean;
  busy: boolean;
  onJoin: () => void;
  onEnd: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="rounded-2xl bg-[#242d47] p-7 text-white">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b9c0ed]">
          <span className="size-1.5 rounded-full bg-[#aeb7ff]" /> Live now
        </span>
        <button
          type="button"
          aria-label="Meeting options"
          className="rounded-lg p-1.5 text-[#9da7cb] hover:bg-white/10"
          onClick={onMenu}
        >
          <MoreVertical className="size-4" />
        </button>
      </div>
      <h2 className="mt-10 max-w-sm text-[25px] font-semibold leading-[1.12] tracking-[-0.04em]">
        {meeting.title}
      </h2>
      <p className="mt-3 text-[13px] text-[#b9c0d2]">
        {meeting.description ?? "Join the conversation."}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <AvatarStack members={meeting.members} />
        <div className="flex items-center gap-2">
          {canEnd ? (
            <Button
              className="h-9 bg-white/10 px-4 text-[12px] font-semibold text-white hover:bg-white/20"
              disabled={busy}
              onClick={onEnd}
            >
              {busy ? (
                <Loader className="size-3.5 animate-spin" />
              ) : (
                <Phone className="size-3.5" />
              )}
              End
            </Button>
          ) : null}
          <Button
            className="h-9 bg-white px-4 text-[12px] font-semibold text-[#2d3855] hover:bg-[#f0f1ff]"
            onClick={onJoin}
          >
            Join call <ExternalLink className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MeetingRow({
  meeting,
  onAction,
}: {
  meeting: MeetingSummary;
  onAction: () => void;
}) {
  const startsAt = new Date(meeting.startsAt);
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#fafafb]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5b64d6]">
        <Video className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#3d4658]">
          {meeting.title}
        </p>
        <p className="mt-0.5 text-[11px] text-[#9aa1ad]">
          {startsAt.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}{" "}
          ·{" "}
          {startsAt.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}{" "}
          · {meeting.members.length} invited
        </p>
      </div>
      <button
        type="button"
        aria-label={`Join ${meeting.title}`}
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#7c85d6] hover:bg-[#eef0ff]"
        onClick={onAction}
      >
        <Phone className="size-3.5" />
      </button>
    </div>
  );
}

function RecentCallRow({
  meeting,
  onAction,
}: {
  meeting: MeetingSummary;
  onAction: () => void;
}) {
  const durationMinutes = meeting.endsAt
    ? Math.max(1, Math.round((meeting.endsAt - meeting.startsAt) / 60000))
    : null;
  const dayLabel = meeting.endsAt
    ? new Date(meeting.endsAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[12px] font-semibold text-[#4b5568]">
          {meeting.title}
        </p>
        <p className="mt-1 text-[11px] text-[#9aa1ad]">
          {dayLabel}
          {durationMinutes !== null ? ` · ${durationMinutes} min` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Call ${meeting.title}`}
        className="flex size-7 items-center justify-center rounded-lg text-[#7c85d6] hover:bg-[#eef0ff]"
        onClick={onAction}
      >
        <Phone className="size-3.5" />
      </button>
    </div>
  );
}

function AvatarStack({ members }: { members: AvatarUser[] }) {
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((member) => (
        <span
          key={member.id}
          className="flex size-7 items-center justify-center rounded-full border-2 border-[#242d47] text-[9px] font-semibold"
          style={{ backgroundColor: member.color }}
        >
          {member.initials}
        </span>
      ))}
      {extra > 0 ? (
        <span className="flex size-7 items-center justify-center rounded-full border-2 border-[#242d47] bg-[#4b5675] text-[9px] font-semibold text-white">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export { CallsView };

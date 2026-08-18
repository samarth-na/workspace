"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  CalendarRange,
  Check,
  ChevronDown,
  Clock,
  Close,
  Loader,
  Pencil,
  Phone,
  Play,
  Search,
  Users,
  Video,
} from "pixelarticons/react";
import { useEffect, useRef, useState } from "react";
import { searchUsers } from "@/components/chat/chat-api";
import {
  addMeetingNote,
  endMeeting,
  fetchMeetingNotes,
  fetchMeetings,
  setMeetingAssignees,
  startMeeting,
} from "@/components/meetings/meeting-api";
import { NewMeetingDialog } from "@/components/meetings/new-meeting-dialog";
import { ViewFrame } from "@/components/shared/view-frame";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import type { AvatarUser } from "@/lib/chat-types";
import type { MeetingNote, MeetingSummary } from "@/lib/meeting-types";
import { cn } from "@/lib/utils";

type NotesMap = Record<string, MeetingNote[]>;

function MeetingsView() {
  const { notify } = useShell();
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<NotesMap>({});
  const [notesOpen, setNotesOpen] = useState<Record<string, boolean>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const loadedNotesRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMeetings();
        if (cancelled) return;
        setMeetings(data.meetings);
        setIsAdmin(data.isAdmin);
        setError(null);
        const fresh = data.meetings.filter(
          (meeting) => !loadedNotesRef.current.has(meeting.id),
        );
        if (fresh.length > 0) {
          const entries = await Promise.all(
            fresh.map(async (meeting): Promise<[string, MeetingNote[]]> => {
              loadedNotesRef.current.add(meeting.id);
              try {
                const response = await fetchMeetingNotes(meeting.id);
                return [meeting.id, response.notes];
              } catch {
                return [meeting.id, []];
              }
            }),
          );
          if (!cancelled) {
            setNotes((prev) => {
              const next = { ...prev };
              for (const [meetingId, meetingNotes] of entries) {
                next[meetingId] = meetingNotes;
              }
              return next;
            });
          }
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load meetings",
        );
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

  const applyMeeting = (meeting: MeetingSummary) => {
    setMeetings((prev) =>
      prev.map((entry) => (entry.id === meeting.id ? meeting : entry)),
    );
  };

  const join = (meetingId: string) => {
    router.push(`/meeting/${meetingId}`);
  };

  const runAdminAction = async (
    meeting: MeetingSummary,
    action: "start" | "end",
  ) => {
    if (pendingAction) return;
    setPendingAction(meeting.id);
    try {
      const response =
        action === "start"
          ? await startMeeting(meeting.id)
          : await endMeeting(meeting.id);
      applyMeeting(response.meeting);
      notify(action === "start" ? "Meeting started" : "Meeting ended");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Action failed");
    } finally {
      setPendingAction(null);
    }
  };

  const submitNote = async (meetingId: string, content: string) => {
    try {
      const response = await addMeetingNote(meetingId, content);
      setNotes((prev) => ({
        ...prev,
        [meetingId]: [response.note, ...(prev[meetingId] ?? [])],
      }));
      return true;
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not add note");
      return false;
    }
  };

  const saveAssignees = async (
    meetingId: string,
    memberIds: string[],
  ): Promise<boolean> => {
    try {
      const response = await setMeetingAssignees(meetingId, { memberIds });
      applyMeeting(response.meeting);
      notify("Assignees updated");
      return true;
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not update assignees");
      return false;
    }
  };

  const now = Date.now();
  const live = meetings.filter((meeting) => meeting.status === "live");
  const upcoming = meetings
    .filter(
      (meeting) => meeting.status === "scheduled" && meeting.startsAt > now,
    )
    .sort((a, b) => a.startsAt - b.startsAt);
  const past = meetings
    .filter((meeting) => meeting.status === "ended")
    .sort((a, b) => (b.endsAt ?? 0) - (a.endsAt ?? 0));

  return (
    <ViewFrame
      title="Meetings"
      description="Start, schedule, and assign meetings. Anyone can add notes."
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
        <div className="max-w-5xl space-y-8">
          <section>
            <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8b94a5]">
              <span className="size-1.5 rounded-full bg-[#4ade80]" />
              Live now
            </h2>
            {live.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#e3e5ea] bg-white p-6 text-center">
                <p className="text-[13px] text-[#788193]">
                  No meetings are live right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {live.map((meeting) => (
                  <LiveMeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    canEnd={isAdmin || meeting.isHost}
                    busy={pendingAction === meeting.id}
                    notes={notes[meeting.id] ?? []}
                    notesOpen={notesOpen[meeting.id] ?? false}
                    onToggleNotes={() =>
                      setNotesOpen((prev) => ({
                        ...prev,
                        [meeting.id]: !(prev[meeting.id] ?? false),
                      }))
                    }
                    onJoin={() => join(meeting.id)}
                    onEnd={() => void runAdminAction(meeting, "end")}
                    onAddNote={(content) => submitNote(meeting.id, content)}
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
                Nothing scheduled. Create a meeting and assign people to it.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white">
                {upcoming.map((meeting, index) => (
                  <div
                    key={meeting.id}
                    className={cn(index > 0 && "border-t border-[#eff0f3]")}
                  >
                    <UpcomingMeetingRow
                      meeting={meeting}
                      isAdmin={isAdmin}
                      busy={pendingAction === meeting.id}
                      notes={notes[meeting.id] ?? []}
                      notesOpen={notesOpen[meeting.id] ?? false}
                      onToggleNotes={() =>
                        setNotesOpen((prev) => ({
                          ...prev,
                          [meeting.id]: !(prev[meeting.id] ?? false),
                        }))
                      }
                      onJoin={() => join(meeting.id)}
                      onStart={() => void runAdminAction(meeting, "start")}
                      onAssign={saveAssignees}
                      onAddNote={(content) => submitNote(meeting.id, content)}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8b94a5]">
              <Clock className="size-3" />
              Past meetings
            </h2>
            {past.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-[#e3e5ea] bg-white p-6 text-center text-[13px] text-[#788193]">
                No past meetings yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white">
                {past.map((meeting, index) => (
                  <div
                    key={meeting.id}
                    className={cn(index > 0 && "border-t border-[#eff0f3]")}
                  >
                    <PastMeetingRow
                      meeting={meeting}
                      notes={notes[meeting.id] ?? []}
                      notesOpen={notesOpen[meeting.id] ?? false}
                      onToggleNotes={() =>
                        setNotesOpen((prev) => ({
                          ...prev,
                          [meeting.id]: !(prev[meeting.id] ?? false),
                        }))
                      }
                      onAddNote={(content) => submitNote(meeting.id, content)}
                    />
                  </div>
                ))}
              </div>
            )}
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
  notes,
  notesOpen,
  onToggleNotes,
  onJoin,
  onEnd,
  onAddNote,
}: {
  meeting: MeetingSummary;
  canEnd: boolean;
  busy: boolean;
  notes: MeetingNote[];
  notesOpen: boolean;
  onToggleNotes: () => void;
  onJoin: () => void;
  onEnd: () => void;
  onAddNote: (content: string) => Promise<boolean>;
}) {
  return (
    <div className="rounded-2xl bg-[#242d47] p-7 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b9c0ed]">
          <span className="size-1.5 rounded-full bg-[#9cb8f7]" /> Live now
        </span>
        <div className="flex items-center gap-2">
          <Button
            className="h-9 bg-white/10 px-4 text-[12px] font-semibold text-white hover:bg-white/20"
            onClick={onJoin}
          >
            Join <Phone className="size-3.5" />
          </Button>
          {canEnd ? (
            <Button
              className="h-9 bg-[#d95c5c] px-4 text-[12px] font-semibold text-white hover:bg-[#c94e4e]"
              disabled={busy}
              onClick={onEnd}
            >
              {busy ? <Loader className="size-3.5 animate-spin" /> : null}
              End meeting
            </Button>
          ) : null}
        </div>
      </div>
      <h2 className="mt-6 max-w-md text-[25px] font-semibold leading-[1.12] tracking-[-0.04em]">
        {meeting.title}
      </h2>
      <p className="mt-2 text-[13px] text-[#b9c0d2]">
        {meeting.description ?? "Join the conversation."}
      </p>
      <div className="mt-6">
        <AvatarStack members={meeting.members} dark />
      </div>
      <NotesBlock
        meeting={meeting}
        notes={notes}
        open={notesOpen}
        onToggle={onToggleNotes}
        onAddNote={onAddNote}
        dark
      />
    </div>
  );
}

function UpcomingMeetingRow({
  meeting,
  isAdmin,
  busy,
  notes,
  notesOpen,
  onToggleNotes,
  onJoin,
  onStart,
  onAssign,
  onAddNote,
}: {
  meeting: MeetingSummary;
  isAdmin: boolean;
  busy: boolean;
  notes: MeetingNote[];
  notesOpen: boolean;
  onToggleNotes: () => void;
  onJoin: () => void;
  onStart: () => void;
  onAssign: (meetingId: string, memberIds: string[]) => Promise<boolean>;
  onAddNote: (content: string) => Promise<boolean>;
}) {
  return (
    <div className="px-5 py-3.5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5b64d6]">
          <Video className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#3d4658]">
            {meeting.title}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#9aa1ad]">
            <span>{formatMeetingTime(meeting.startsAt)}</span>
            <span>·</span>
            <span>
              {meeting.members.length}{" "}
              {meeting.members.length === 1 ? "person" : "people"} assigned
            </span>
          </p>
        </div>
        <div className="hidden sm:block">
          <AvatarStack members={meeting.members} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {isAdmin ? (
            <>
              <AssignPopover
                meeting={meeting}
                onSave={(ids) => onAssign(meeting.id, ids)}
              />
              <Button
                className="h-8 bg-[#5b64d6] px-3 text-[12px] font-semibold hover:bg-[#4e57c5]"
                disabled={busy}
                onClick={onStart}
              >
                {busy ? (
                  <Loader className="size-3.5 animate-spin" />
                ) : (
                  <Play className="size-3.5" />
                )}
                Start
              </Button>
            </>
          ) : null}
          <button
            type="button"
            aria-label={`Join ${meeting.title}`}
            className="flex size-8 items-center justify-center rounded-lg text-[#7c85d6] hover:bg-[#eef0ff]"
            onClick={onJoin}
          >
            <Phone className="size-3.5" />
          </button>
          <button
            type="button"
            aria-label={`Toggle notes for ${meeting.title}`}
            className="flex size-8 items-center justify-center rounded-lg text-[#9aa1ad] hover:bg-[#f4f5f8]"
            onClick={onToggleNotes}
          >
            <ChevronDown
              className={cn(
                "size-4 transition-transform",
                notesOpen && "rotate-180",
              )}
            />
          </button>
        </div>
      </div>
      <NotesBlock
        meeting={meeting}
        notes={notes}
        open={notesOpen}
        onToggle={onToggleNotes}
        onAddNote={onAddNote}
      />
    </div>
  );
}

function PastMeetingRow({
  meeting,
  notes,
  notesOpen,
  onToggleNotes,
  onAddNote,
}: {
  meeting: MeetingSummary;
  notes: MeetingNote[];
  notesOpen: boolean;
  onToggleNotes: () => void;
  onAddNote: (content: string) => Promise<boolean>;
}) {
  const start = new Date(meeting.startsAt);
  const end = meeting.endsAt ? new Date(meeting.endsAt) : null;
  const durationMinutes = end
    ? Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))
    : null;
  const participants = meeting.members;
  const shownNames = participants.slice(0, 3).map((member) => member.name);
  const extraCount = participants.length - shownNames.length;
  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f1f4] text-[#8b94a5]">
          <Video className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[13px] font-semibold text-[#3d4658]">
              {meeting.title}
            </p>
            <button
              type="button"
              aria-label={`Toggle notes for ${meeting.title}`}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-[#7c85d6] hover:bg-[#eef0ff]"
              onClick={onToggleNotes}
            >
              <Pencil className="size-3.5" />
              Notes {notes.length > 0 ? `(${notes.length})` : ""}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  notesOpen && "rotate-180",
                )}
              />
            </button>
          </div>
          {meeting.description ? (
            <p className="mt-1 truncate text-[11px] text-[#9aa1ad]">
              {meeting.description}
            </p>
          ) : null}
          <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#9aa1ad]">
            <Calendar className="size-3.5 shrink-0" />
            {formatMeetingTime(meeting.startsAt)}
            {end ? ` – ${formatTimeOnly(end)}` : ""}
            {durationMinutes !== null ? ` · ${durationMinutes} min` : ""}
          </p>
          <p className="mt-1 text-[11px] text-[#9aa1ad]">
            Hosted by {meeting.host?.name ?? "Unknown"}
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <AvatarStack members={participants} />
            <p className="min-w-0 truncate text-[11px] text-[#9aa1ad]">
              {shownNames.join(", ")}
              {extraCount > 0 ? ` and ${extraCount} more` : ""}
              {" · "}
              {participants.length}{" "}
              {participants.length === 1 ? "participant" : "participants"}
            </p>
          </div>
        </div>
      </div>
      <NotesBlock
        meeting={meeting}
        notes={notes}
        open={notesOpen}
        onToggle={onToggleNotes}
        onAddNote={onAddNote}
      />
    </div>
  );
}

function NotesBlock({
  meeting,
  notes,
  open,
  onToggle,
  onAddNote,
  dark = false,
}: {
  meeting: MeetingSummary;
  notes: MeetingNote[];
  open: boolean;
  onToggle: () => void;
  onAddNote: (content: string) => Promise<boolean>;
  dark?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (submitting || draft.trim().length === 0) return;
    setSubmitting(true);
    const ok = await onAddNote(draft.trim());
    setSubmitting(false);
    if (ok) setDraft("");
  };

  return (
    <div
      className={cn(
        "mt-6 rounded-xl",
        dark ? "bg-white/[0.07]" : "border-t border-[#eff0f3] pt-3",
      )}
    >
      <button
        type="button"
        aria-label={`Toggle notes for ${meeting.title}`}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] font-semibold",
          dark
            ? "text-[#c3c9df] hover:bg-white/5"
            : "text-[#5b6474] hover:bg-[#f6f7f9]",
        )}
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          <Pencil className="size-3.5" />
          Notes {notes.length > 0 ? `(${notes.length})` : ""}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 transition-transform",
            dark ? "text-[#8d94ad]" : "text-[#9aa1ad]",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className={cn("px-3 pb-3", dark && "bg-white/[0.04]")}>
          {notes.length === 0 ? (
            <p
              className={cn(
                "py-2 text-[12px]",
                dark ? "text-[#8d94ad]" : "text-[#9aa1ad]",
              )}
            >
              No notes yet. Add the first one below.
            </p>
          ) : (
            <ul className="space-y-3 py-2">
              {notes.map((note) => (
                <NoteRow key={note.id} note={note} dark={dark} />
              ))}
            </ul>
          )}
          <div className="mt-1 flex items-start gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
              rows={2}
              maxLength={1000}
              placeholder="Add a note…"
              className={cn(
                "min-h-0 flex-1 resize-none rounded-lg border px-3 py-2 text-[12px] outline-none placeholder:text-[#b3bac8] focus:ring-2 focus:ring-[#8b93ff]/25",
                dark
                  ? "border-white/10 bg-white/5 text-white placeholder:text-[#7c849d] focus:border-[#8b93ff]"
                  : "border-[#e3e5ea] bg-white text-[#20293c] focus:border-[#8b93ff]",
              )}
            />
            <Button
              type="button"
              size="sm"
              disabled={draft.trim().length === 0 || submitting}
              className="h-8 shrink-0 bg-[#5b64d6] text-[11px] font-semibold hover:bg-[#4e57c5]"
              onClick={() => void submit()}
            >
              {submitting ? <Loader className="size-3 animate-spin" /> : null}
              Add note
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NoteRow({ note, dark }: { note: MeetingNote; dark: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className={cn(
          "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold",
          dark ? "text-[#31518e]" : "text-[#31518e]",
        )}
        style={{ backgroundColor: note.author.color }}
      >
        {note.author.initials}
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[11px] font-semibold",
            dark ? "text-[#c3c9df]" : "text-[#4b5568]",
          )}
        >
          {note.author.name}
          <span
            className={cn(
              "ml-2 font-normal",
              dark ? "text-[#7c849d]" : "text-[#9aa1ad]",
            )}
          >
            {formatNoteTime(note.createdAt)}
          </span>
        </p>
        <p
          className={cn(
            "mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed",
            dark ? "text-[#b9c0d2]" : "text-[#4b5568]",
          )}
        >
          {note.content}
        </p>
      </div>
    </li>
  );
}

function AssignPopover({
  meeting,
  onSave,
}: {
  meeting: MeetingSummary;
  onSave: (memberIds: string[]) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [people, setPeople] = useState<AvatarUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(meeting.members.map((member) => member.id)),
  );
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSearching(true);
    searchUsers(query.trim())
      .then((data) => {
        if (!cancelled) setPeople(data.users);
      })
      .catch(() => {
        if (!cancelled) setPeople([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  useEffect(() => {
    setSelected(new Set(meeting.members.map((member) => member.id)));
  }, [meeting.members]);

  const toggle = (personId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    const ok = await onSave([...selected]);
    setSaving(false);
    if (ok) setOpen(false);
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-[12px] font-semibold text-[#5b6474] hover:bg-[#f0f1f4]"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Users className="size-3.5" />
        Assign
      </Button>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-9 z-50 w-72 rounded-xl border border-[#e3e5ea] bg-white p-3 shadow-[0_16px_40px_rgba(35,43,66,0.16)]">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b94a5]">
              Assign people
            </p>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#b3bac8]" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people…"
                className="h-8 w-full rounded-lg border border-[#e3e5ea] bg-white pl-8 pr-2.5 text-[12px] text-[#20293c] outline-none placeholder:text-[#b3bac8] focus:border-[#8b93ff] focus:ring-2 focus:ring-[#8b93ff]/25"
              />
            </div>
            <ul className="mt-2 max-h-48 overflow-y-auto">
              {searching ? (
                <li className="px-2 py-2 text-[11px] text-[#9aa1ad]">
                  Searching…
                </li>
              ) : people.length === 0 ? (
                <li className="px-2 py-2 text-[11px] text-[#9aa1ad]">
                  No people found.
                </li>
              ) : (
                people.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-[#f4f5f8]"
                      onClick={() => toggle(person.id)}
                    >
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-[#31518e]"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.initials}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-[#4b5568]">
                        {person.name}
                      </span>
                      {selected.has(person.id) ? (
                        <span className="flex size-4 items-center justify-center rounded-full bg-[#5b64d6] text-white">
                          <Check className="size-2.5" />
                        </span>
                      ) : (
                        <span className="size-4 rounded-full border border-[#dfe2e8]" />
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-2 flex items-center justify-between border-t border-[#eff0f3] pt-2.5">
              <p className="text-[11px] text-[#9aa1ad]">
                {selected.size} selected
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Close assign popover"
                  className="rounded-lg p-1.5 text-[#8b94a5] hover:bg-[#f4f5f8]"
                  onClick={() => setOpen(false)}
                >
                  <Close className="size-3.5" />
                </button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  className="h-8 bg-[#5b64d6] px-3 text-[11px] font-semibold hover:bg-[#4e57c5]"
                  onClick={() => void save()}
                >
                  {saving ? (
                    <Loader className="size-3 animate-spin" />
                  ) : (
                    <Check className="size-3" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function AvatarStack({
  members,
  dark = false,
}: {
  members: AvatarUser[];
  dark?: boolean;
}) {
  const shown = members.slice(0, 4);
  const extra = members.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((member) => (
        <span
          key={member.id}
          className={cn(
            "flex size-7 items-center justify-center rounded-full border-2 text-[9px] font-semibold",
            dark ? "border-[#242d47] text-[#31518e]" : "border-white",
          )}
          style={{ backgroundColor: member.color }}
        >
          {member.initials}
        </span>
      ))}
      {extra > 0 ? (
        <span
          className={cn(
            "flex size-7 items-center justify-center rounded-full border-2 text-[9px] font-semibold text-white",
            dark
              ? "border-[#242d47] bg-[#4b5675]"
              : "border-white bg-[#8b94a5]",
          )}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

function formatMeetingTime(timestamp: number) {
  const date = new Date(timestamp);
  const time = formatTimeOnly(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (date.toDateString() === today.toDateString()) return `Today · ${time}`;
  if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow · ${time}`;
  }
  return `${date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} · ${time}`;
}

function formatTimeOnly(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatNoteTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export { MeetingsView };

"use client";

import { Check, Loader2, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { searchUsers } from "@/components/chat/chat-api";
import { createMeeting } from "@/components/meetings/meeting-api";
import { Button } from "@/components/ui/button";
import type { AvatarUser } from "@/lib/chat-types";

function NewMeetingDialog({
  onClose,
  onNotify,
}: {
  onClose: () => void;
  onNotify: (message: string) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [invitees, setInvitees] = useState<AvatarUser[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AvatarUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchUsers(query.trim())
      .then((data) => {
        if (!cancelled) setResults(data.users);
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const addInvitee = (person: AvatarUser) => {
    setInvitees((prev) =>
      prev.some((entry) => entry.id === person.id) ? prev : [...prev, person],
    );
    setQuery("");
  };

  const submit = async () => {
    if (submitting) return;
    setError(null);
    try {
      setSubmitting(true);
      const data = await createMeeting({
        title,
        description: description.trim() || undefined,
        memberIds: invitees.map((person) => person.id),
      });
      onNotify("Meeting created");
      onClose();
      router.push(`/meeting/${data.meetingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create meeting");
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && !submitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c212e]/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New meeting"
        className="w-full max-w-[440px] rounded-2xl border border-[#e3e5ea] bg-white p-6 shadow-[0_20px_50px_rgba(35,43,66,0.18)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#20293c]">
            New meeting
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-[#8b94a5] hover:bg-[#f4f5f8]"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="mt-1 text-[12px] text-[#788193]">
          Start a video call. Invite people by name or email.
        </p>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSubmit) void submit();
          }}
        >
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b94a5]">
              Title
            </span>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Weekly product sync"
              maxLength={120}
              className="h-9 w-full rounded-lg border border-[#e3e5ea] bg-white px-3 text-[13px] text-[#20293c] outline-none placeholder:text-[#b3bac8] focus:border-[#8b93ff] focus:ring-2 focus:ring-[#8b93ff]/25"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b94a5]">
              Agenda (optional)
            </span>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What's this call about?"
              maxLength={500}
              className="h-9 w-full rounded-lg border border-[#e3e5ea] bg-white px-3 text-[13px] text-[#20293c] outline-none placeholder:text-[#b3bac8] focus:border-[#8b93ff] focus:ring-2 focus:ring-[#8b93ff]/25"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8b94a5]">
              Invite
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#b3bac8]" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search people…"
                className="h-9 w-full rounded-lg border border-[#e3e5ea] bg-white pl-9 pr-3 text-[13px] text-[#20293c] outline-none placeholder:text-[#b3bac8] focus:border-[#8b93ff] focus:ring-2 focus:ring-[#8b93ff]/25"
              />
            </div>
            {results.length > 0 ? (
              <ul className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-[#eef0f3] py-1">
                {results.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left hover:bg-[#f4f5f8]"
                      onClick={() => addInvitee(person)}
                    >
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
                        style={{ backgroundColor: person.color }}
                      >
                        {person.initials}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-[#4b5568]">
                        {person.name}
                      </span>
                      {invitees.some((entry) => entry.id === person.id) ? (
                        <Check className="size-3.5 text-[#5b64d6]" />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {searching ? (
              <p className="mt-1.5 text-[11px] text-[#9aa1ad]">Searching…</p>
            ) : null}
            {invitees.length > 0 ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {invitees.map((person) => (
                  <li
                    key={person.id}
                    className="flex items-center gap-1.5 rounded-full bg-[#eef0ff] py-1 pl-1 pr-2"
                  >
                    <span
                      className="flex size-5 items-center justify-center rounded-full text-[8px] font-semibold"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.initials}
                    </span>
                    <span className="text-[11px] font-medium text-[#4b5568]">
                      {person.name}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${person.name}`}
                      className="rounded-full p-0.5 text-[#8b94a5] hover:text-[#4b5568]"
                      onClick={() =>
                        setInvitees((prev) =>
                          prev.filter((entry) => entry.id !== person.id),
                        )
                      }
                    >
                      <X className="size-3" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {error ? (
            <p className="text-[12px] text-[#dc3d43]" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-[12px]"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit}
              className="bg-[#5b64d6] text-[12px] font-semibold hover:bg-[#4e57c5]"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {submitting ? "Creating…" : "Create & join"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export { NewMeetingDialog };

"use client";

import { useRouter } from "next/navigation";
import { Check, Close, Loader, Search } from "pixelarticons/react";
import { useEffect, useState } from "react";
import { createDm, createGroup, searchUsers } from "@/components/chat/chat-api";
import { useShell } from "@/components/shell/shell-context";
import type { AvatarUser } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

type Mode = "dm" | "group";

function NewConversationDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { isSignedIn } = useShell();
  const [mode, setMode] = useState<Mode>("dm");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AvatarUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [topic, setTopic] = useState("");

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    const timer = window.setTimeout(() => {
      searchUsers(query.trim())
        .then((data) => {
          if (cancelled) return;
          setUsers(data.users);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(
            err instanceof Error ? err.message : "Failed to search people",
          );
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, isSignedIn]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const openDm = async (user: AvatarUser) => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { conversationId } = await createDm(user.id);
      window.dispatchEvent(new Event("chat:local-change"));
      router.push(`/messages/${conversationId}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open chat");
      setSubmitting(false);
    }
  };

  const toggleSelection = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const createGroupChat = async () => {
    if (selected.size === 0 || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const { conversationId } = await createGroup({
        userIds: [...selected],
        name: groupName,
        topic,
      });
      window.dispatchEvent(new Event("chat:local-change"));
      router.push(`/messages/${conversationId}`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group");
      setSubmitting(false);
    }
  };

  const selectedUsers = users.filter((user) => selected.has(user.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-[#202024]/25"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(640px,calc(100dvh-32px))] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-[#e3e5ea] bg-white shadow-[0_24px_60px_rgba(35,43,66,0.18)]">
        <div className="flex items-center justify-between border-b border-[#eff0f3] px-5 py-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#20293c]">
            New conversation
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1.5 text-[#9aa1ad] transition-colors hover:bg-[#f2f3f6] hover:text-[#535dc9]"
          >
            <Close className="size-4" />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3">
          <ModeTab
            label="Message"
            active={mode === "dm"}
            onClick={() => setMode("dm")}
          />
          <ModeTab
            label="Group"
            active={mode === "group"}
            onClick={() => setMode("group")}
          />
        </div>

        <div className="px-5 pt-3">
          <div className="flex items-center gap-2 rounded-lg border border-[#e5e7ec] px-2.5 py-2 focus-within:border-[#c7cbe0]">
            <Search
              className="size-3.5 shrink-0 text-[#9aa1ad]"
              aria-hidden="true"
            />
            <input
              aria-label={mode === "dm" ? "Find people" : "Find people to add"}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-[#a1a8b5]"
              placeholder={
                mode === "dm"
                  ? "Find people to message..."
                  : "Find people to add..."
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        {!isSignedIn ? (
          <p className="px-5 py-10 text-center text-[12px] text-[#9aa1ad]">
            Sign in to start new conversations.
          </p>
        ) : (
          <div className="workspace-sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
            {error ? (
              <p className="px-3 py-8 text-center text-[12px] text-[#d0564f]">
                {error}
              </p>
            ) : loading && users.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-[12px] text-[#9aa1ad]">
                <Loader className="size-3.5 animate-spin" />
                Searching...
              </div>
            ) : users.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] text-[#9aa1ad]">
                No people found
              </p>
            ) : (
              <ul className="space-y-0.5">
                {users.map((user) => {
                  const isSelected = selected.has(user.id);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        onClick={() =>
                          mode === "dm"
                            ? openDm(user)
                            : toggleSelection(user.id)
                        }
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                          mode === "group" && isSelected
                            ? "bg-[#eef0ff]"
                            : "hover:bg-[#f5f6f8]",
                        )}
                      >
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-[#31518e]"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-[#30394c]">
                            {user.name}
                          </span>
                        </span>
                        {mode === "group" ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                              isSelected
                                ? "border-[#5b64d6] bg-[#5b64d6] text-white"
                                : "border-[#d9dce3] text-transparent",
                            )}
                          >
                            <Check className="size-3" />
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-[#6972cd]">
                            Message
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {isSignedIn && mode === "group" ? (
          <div className="space-y-3 border-t border-[#eff0f3] p-4">
            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((user) => (
                  <span
                    key={user.id}
                    className="flex items-center gap-1.5 rounded-full bg-[#eef0ff] py-1 pl-1 pr-2 text-[11px] font-medium text-[#535dc9]"
                  >
                    <span
                      className="flex size-4 items-center justify-center rounded-full text-[7px] font-semibold text-[#31518e]"
                      style={{ backgroundColor: user.color }}
                    >
                      {user.initials}
                    </span>
                    {user.name.split(" ")[0]}
                    <button
                      type="button"
                      aria-label={`Remove ${user.name}`}
                      onClick={() => toggleSelection(user.id)}
                      className="text-[#8b93c8] transition-colors hover:text-[#535dc9]"
                    >
                      <Close className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <input
              aria-label="Group name"
              maxLength={60}
              className="w-full rounded-lg border border-[#e5e7ec] px-3 py-2 text-[13px] outline-none placeholder:text-[#a1a8b5] focus:border-[#c7cbe0]"
              placeholder="Group name (optional)"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
            />
            <input
              aria-label="Group topic"
              maxLength={200}
              className="w-full rounded-lg border border-[#e5e7ec] px-3 py-2 text-[13px] outline-none placeholder:text-[#a1a8b5] focus:border-[#c7cbe0]"
              placeholder="Topic (optional)"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
            <button
              type="button"
              disabled={selected.size === 0 || submitting}
              onClick={createGroupChat}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#5b64d6] text-[12px] font-semibold text-white transition-colors hover:bg-[#4e57c5] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-[#5b64d6]"
            >
              {submitting ? <Loader className="size-3.5 animate-spin" /> : null}
              Create group{selected.size > 0 ? ` (${selected.size})` : ""}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
        active
          ? "bg-[#eef0ff] text-[#535dc9]"
          : "text-[#8c94a4] hover:bg-[#f5f6f8] hover:text-[#596275]",
      )}
    >
      {label}
    </button>
  );
}

export { NewConversationDialog };

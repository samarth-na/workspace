"use client";

import { useRouter } from "next/navigation";
import {
  Clock,
  ExternalLink,
  Loader,
  MoreVertical,
  Phone,
} from "pixelarticons/react";
import { useEffect, useState } from "react";
import { endCall, fetchCalls } from "@/components/calls/call-api";
import { NewCallDialog } from "@/components/calls/new-call-dialog";
import { ViewFrame } from "@/components/shared/view-frame";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";
import type { CallSummary } from "@/lib/call-types";
import type { AvatarUser } from "@/lib/chat-types";

function CallsView() {
  const { notify } = useShell();
  const router = useRouter();
  const [calls, setCalls] = useState<CallSummary[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewCall, setShowNewCall] = useState(false);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchCalls();
        if (cancelled) return;
        setCalls(data.calls);
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
  const ringing = calls.filter(
    (call) =>
      call.status === "ringing" ||
      (call.status === "live" && call.startedAt <= now),
  );
  const recent = calls
    .filter((call) => call.status === "ended")
    .sort((a, b) => (b.endsAt ?? 0) - (a.endsAt ?? 0));

  const join = (callId: string) => {
    router.push(`/call/${callId}`);
  };

  const end = async (callId: string) => {
    if (pendingEnd) return;
    setPendingEnd(callId);
    try {
      const response = await endCall(callId);
      setCalls((prev) => prev.filter((entry) => entry.id !== response.call.id));
      notify("Call ended");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Could not end call");
    } finally {
      setPendingEnd(null);
    }
  };

  return (
    <ViewFrame
      title="Calls"
      description="Start a call or join one that's already ringing."
      action="New call"
      onAction={() => setShowNewCall(true)}
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
                <span className="size-1.5 animate-pulse rounded-full bg-[#f5a623]" />
                Active calls
              </h2>
              {ringing.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e3e5ea] bg-white p-6 text-center">
                  <p className="text-[13px] text-[#788193]">
                    No calls are live right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ringing.map((call) => (
                    <LiveCallCard
                      key={call.id}
                      call={call}
                      canEnd={isAdmin || call.isHost}
                      busy={pendingEnd === call.id}
                      onJoin={() => join(call.id)}
                      onEnd={() => void end(call.id)}
                      onMenu={() => notify("Call options opened")}
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
                  recent.map((call) => (
                    <RecentCallRow
                      key={call.id}
                      call={call}
                      onAction={() => notify(`Calling ${callTitle(call)}`)}
                    />
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {showNewCall ? (
        <NewCallDialog
          onClose={() => setShowNewCall(false)}
          onNotify={notify}
          onStarted={() => setShowNewCall(false)}
        />
      ) : null}
    </ViewFrame>
  );
}

function callTitle(call: CallSummary): string {
  const names = call.members.map((member) => member.name);
  return (
    names.slice(0, 3).join(", ") +
    (names.length > 3 ? ` +${names.length - 3}` : "")
  );
}

function LiveCallCard({
  call,
  canEnd,
  busy,
  onJoin,
  onEnd,
  onMenu,
}: {
  call: CallSummary;
  canEnd: boolean;
  busy: boolean;
  onJoin: () => void;
  onEnd: () => void;
  onMenu: () => void;
}) {
  const ringing = call.status === "ringing";
  return (
    <div className="rounded-2xl bg-[#242d47] p-7 text-white">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#b9c0ed]">
          <span
            className={`size-1.5 rounded-full ${ringing ? "animate-pulse bg-[#9cb8f7]" : "bg-[#4ade80]"}`}
          />
          {ringing ? "Ringing" : "Live now"}
        </span>
        <button
          type="button"
          aria-label="Call options"
          className="rounded-lg p-1.5 text-[#9da7cb] hover:bg-white/10"
          onClick={onMenu}
        >
          <MoreVertical className="size-4" />
        </button>
      </div>
      <h2 className="mt-10 max-w-sm text-[25px] font-semibold leading-[1.12] tracking-[-0.04em]">
        {callTitle(call)}
      </h2>
      <p className="mt-3 text-[13px] text-[#b9c0d2]">
        {call.isHost
          ? "You started this call."
          : `Called by ${call.host?.name ?? "a teammate"}.`}
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <AvatarStack members={call.members} />
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

function RecentCallRow({
  call,
  onAction,
}: {
  call: CallSummary;
  onAction: () => void;
}) {
  const durationMinutes = call.endsAt
    ? Math.max(1, Math.round((call.endsAt - call.startedAt) / 60000))
    : null;
  const dayLabel = call.endsAt
    ? new Date(call.endsAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[12px] font-semibold text-[#4b5568]">
          {callTitle(call)}
        </p>
        <p className="mt-1 text-[11px] text-[#9aa1ad]">
          {dayLabel}
          {durationMinutes !== null ? ` · ${durationMinutes} min` : ""}
        </p>
      </div>
      <button
        type="button"
        aria-label={`Call ${callTitle(call)} again`}
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

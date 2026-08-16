"use client";

import { useRouter } from "next/navigation";
import {
  Calendar,
  Crown,
  Image as ImageIcon,
  Shield,
  Trash,
  UserPlus,
} from "pixelarticons/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { compressImage } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import type {
  WorkspaceMemberItem,
  WorkspaceResponse,
  WorkspaceRole,
} from "@/lib/workspace-types";

type LoadingState = "idle" | "saving" | "deleting";

export function WorkspaceSettings({
  initialName,
  initialLogo,
  isAdmin,
  role,
}: {
  initialName: string;
  initialLogo: string | null;
  isAdmin: boolean;
  role: WorkspaceRole;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [members, setMembers] = useState<WorkspaceMemberItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState<LoadingState>("idle");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/workspace");
      if (!response.ok) return;
      const data = (await response.json()) as WorkspaceResponse;
      setName(data.workspace.name);
      setLogo(data.workspace.logo);
      setMembers(data.members);
    } catch {
      setError("Could not load workspace data");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError("Name cannot be empty");
      return;
    }
    setLoading("saving");
    setError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not rename workspace");
        return;
      }
      setName(trimmed);
      flash("Workspace renamed");
      router.refresh();
    } catch {
      setError("Could not rename workspace");
    } finally {
      setLoading("idle");
    }
  };

  const saveLogo = async (logoUrl: string | null) => {
    setUploadingLogo(true);
    setError("");
    try {
      const response = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: logoUrl }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not update logo");
        return;
      }
      setLogo(logoUrl);
      flash(logoUrl ? "Workspace logo updated" : "Workspace logo removed");
      router.refresh();
    } catch {
      setError("Could not update logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploadingLogo(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      const form = new FormData();
      form.append("file", compressed);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "Could not upload logo");
        return;
      }
      await saveLogo(data.url);
    } catch {
      setError("Could not upload logo");
      setUploadingLogo(false);
    }
  };

  const invite = async () => {
    const email = inviteEmail.trim();
    if (email.length === 0) return;
    setError("");
    try {
      const response = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        member?: WorkspaceMemberItem;
        error?: string;
      };
      if (!response.ok || !data.member) {
        setError(data.error ?? "Could not invite member");
        return;
      }
      setInviteEmail("");
      flash(`${data.member.name} added to the workspace`);
      await load();
    } catch {
      setError("Could not invite member");
    }
  };

  const changeRole = async (userId: string, nextRole: WorkspaceRole) => {
    setError("");
    try {
      const response = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: nextRole }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not change role");
        return;
      }
      flash("Role updated");
      await load();
    } catch {
      setError("Could not change role");
    }
  };

  const removeMember = async (userId: string) => {
    setError("");
    try {
      const response = await fetch("/api/workspace/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not remove member");
        return;
      }
      flash("Member removed");
      await load();
    } catch {
      setError("Could not remove member");
    }
  };

  const deleteWorkspace = async () => {
    const confirmed = window.confirm(
      "Delete this workspace and all of its data? This cannot be undone.",
    );
    if (!confirmed) return;
    setLoading("deleting");
    setError("");
    try {
      const response = await fetch("/api/workspace", { method: "DELETE" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not delete workspace");
        return;
      }
      router.push("/home");
      router.refresh();
    } catch {
      setError("Could not delete workspace");
    } finally {
      setLoading("idle");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-[#23272f]">
          Workspace settings
        </h1>
        <p className="mt-1 text-[13px] text-[#8991a3]">
          {isAdmin
            ? "Manage your workspace, its members, and their roles."
            : "You can view workspace settings. Only admins can change them."}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            The workspace name shows in the sidebar and profile menu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={name}
              disabled={!isAdmin || loading === "saving"}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && isAdmin) void saveName();
              }}
              aria-label="Workspace name"
            />
            {isAdmin ? (
              <Button
                variant="secondary"
                onClick={() => void saveName()}
                disabled={loading === "saving" || name.trim() === initialName}
              >
                {loading === "saving" ? "Saving…" : "Save"}
              </Button>
            ) : null}
          </div>
          <div className="mt-5 flex items-center gap-3">
            {logo ? (
              <img
                src={logo}
                alt="Workspace logo"
                className="size-10 shrink-0 rounded-[10px] border border-[#e3e5ea] object-cover"
              />
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#9cb8f7] text-[14px] font-semibold text-[#31518e]">
                {name.slice(0, 1).toUpperCase() || "C"}
              </span>
            )}
            <div className="flex items-center gap-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(event) => void uploadLogo(event)}
              />
              <Button
                variant="secondary"
                disabled={!isAdmin || uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
              >
                <ImageIcon className="size-3.5" />
                {uploadingLogo ? "Uploading…" : "Upload logo"}
              </Button>
              {isAdmin && logo ? (
                <Button
                  variant="ghost"
                  disabled={uploadingLogo}
                  onClick={() => void saveLogo(null)}
                >
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length === 1 ? "" : "s"} in this
            workspace. {isAdmin ? "Invite users by email." : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isAdmin ? (
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void invite();
                }}
                aria-label="Invite by email"
              />
              <Button
                variant="secondary"
                onClick={() => void invite()}
                disabled={inviteEmail.trim().length === 0}
              >
                <UserPlus className="size-3.5" />
                Invite
              </Button>
            </div>
          ) : null}
          <ul className="flex flex-col">
            {members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 border-t border-[#eef0f4] py-3 first:border-t-0"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-[13px] font-medium text-[#2e3238]">
                      {member.name}
                    </span>
                    {member.role === "admin" ? (
                      <Crown className="size-3.5 shrink-0 text-[#c2913c]" />
                    ) : null}
                  </span>
                  <span className="block truncate text-[12px] text-[#8991a3]">
                    {member.email}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <select
                        aria-label={`Role for ${member.name}`}
                        className="h-7 rounded-lg border border-[#e3e5ea] bg-white px-2 text-[12px] text-[#596275] outline-none focus-visible:ring-2 focus-visible:ring-[#6873dc]/30"
                        value={member.role}
                        onChange={(event) =>
                          void changeRole(
                            member.id,
                            event.target.value as WorkspaceRole,
                          )
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${member.name}`}
                        onClick={() => void removeMember(member.id)}
                      >
                        <Trash className="size-3.5 text-[#b42318]" />
                      </Button>
                    </>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                        member.role === "admin"
                          ? "bg-[#f7edd9] text-[#8a6520]"
                          : "bg-[#eef0f4] text-[#5d6677]",
                      )}
                    >
                      {member.role === "admin" ? (
                        <Shield className="size-3" />
                      ) : null}
                      {member.role}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-[#b42318]">Danger zone</CardTitle>
            <CardDescription>
              Delete the workspace and all its data. Members lose access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={() => void deleteWorkspace()}
              disabled={loading === "deleting"}
            >
              <Trash className="size-3.5" />
              {loading === "deleting" ? "Deleting…" : "Delete workspace"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {role === "admin" ? null : (
        <p className="flex items-center gap-1.5 text-[12px] text-[#8991a3]">
          <Calendar className="size-3.5" />
          Ask a workspace admin to change settings you cannot edit.
        </p>
      )}

      {error ? (
        <p
          aria-live="polite"
          className="rounded-lg bg-[#fdf0f0] px-3 py-2 text-[12px] text-[#b42318]"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          aria-live="polite"
          className="rounded-lg bg-[#eef4ee] px-3 py-2 text-[12px] text-[#3d7a4c]"
        >
          {notice}
        </p>
      ) : null}
    </div>
  );
}

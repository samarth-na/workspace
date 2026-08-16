import { and, eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";

import { db } from "@/db";
import { file } from "@/db/files";
import { user } from "@/db/schema";
import { workspace, workspaceMember } from "@/db/workspace";
import { avatarUserFor, getSessionUser } from "@/lib/chat-data";
import type {
  WorkspaceContext,
  WorkspaceMemberItem,
  WorkspaceRole,
} from "@/lib/workspace-types";

export async function getSessionWorkspace(): Promise<WorkspaceContext | null> {
  const self = await getSessionUser();
  if (!self) return null;
  return workspaceForUser(self.id, self.name);
}

export async function workspaceForUser(
  userId: string,
  userName: string,
): Promise<WorkspaceContext> {
  const memberships = await db
    .select()
    .from(workspaceMember)
    .where(eq(workspaceMember.userId, userId))
    .limit(1);
  const membership = memberships[0];
  if (membership) {
    const rows = await db
      .select()
      .from(workspace)
      .where(eq(workspace.id, membership.workspaceId))
      .limit(1);
    if (rows[0]) {
      return {
        workspaceId: rows[0].id,
        workspaceName: rows[0].name,
        workspaceLogo: rows[0].logo,
        role: membership.role,
        isAdmin: membership.role === "admin",
      };
    }
  }
  const id = crypto.randomUUID();
  const name = `${userName}'s Workspace`;
  await db
    .insert(workspace)
    .values({ id, name, createdBy: userId })
    .onConflictDoNothing();
  await db
    .insert(workspaceMember)
    .values({ workspaceId: id, userId, role: "admin" })
    .onConflictDoNothing();
  return {
    workspaceId: id,
    workspaceName: name,
    workspaceLogo: null,
    role: "admin",
    isAdmin: true,
  };
}

export async function previewWorkspaceId(): Promise<string | null> {
  const rows = await db.select({ id: workspace.id }).from(workspace).limit(1);
  return rows[0]?.id ?? null;
}

export async function workspaceMemberIds(
  workspaceId: string,
): Promise<string[]> {
  const rows = await db
    .select({ userId: workspaceMember.userId })
    .from(workspaceMember)
    .where(eq(workspaceMember.workspaceId, workspaceId));
  return rows.map((row) => row.userId);
}

export async function isWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select({ userId: workspaceMember.userId })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function fetchWorkspaceMembers(
  workspaceId: string,
): Promise<WorkspaceMemberItem[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: workspaceMember.role,
      joinedAt: workspaceMember.joinedAt,
    })
    .from(workspaceMember)
    .innerJoin(user, eq(user.id, workspaceMember.userId))
    .where(eq(workspaceMember.workspaceId, workspaceId));
  return rows
    .sort((a, b) => {
      if (a.role === b.role) return a.name.localeCompare(b.name);
      return a.role === "admin" ? -1 : 1;
    })
    .map((row) => ({
      ...avatarUserFor({ id: row.id, name: row.name, email: row.email }),
      email: row.email,
      role: row.role,
      joinedAt: row.joinedAt.getTime(),
    }));
}

export async function findUserByEmail(email: string) {
  const rows = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.email, email.toLowerCase().trim()))
    .limit(1);
  return rows[0] ?? null;
}

export type MemberActionResult =
  | { ok: true; member: WorkspaceMemberItem }
  | { ok: false; error: string };

export async function inviteMemberByEmail(
  workspaceId: string,
  email: string,
): Promise<MemberActionResult> {
  const target = await findUserByEmail(email);
  if (!target) {
    return { ok: false, error: "No user with that email exists" };
  }
  if (await isWorkspaceMember(workspaceId, target.id)) {
    return { ok: false, error: "User is already a member" };
  }
  await db
    .insert(workspaceMember)
    .values({ workspaceId, userId: target.id, role: "member" })
    .onConflictDoNothing();
  const members = await fetchWorkspaceMembers(workspaceId);
  const member = members.find((m) => m.id === target.id);
  if (!member) {
    return { ok: false, error: "Could not add member" };
  }
  return { ok: true, member };
}

export async function setMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<MemberActionResult> {
  const memberships = await db
    .select()
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .limit(1);
  if (!memberships[0]) {
    return { ok: false, error: "User is not a member" };
  }
  if (role === "member") {
    const adminRows = await db
      .select({ userId: workspaceMember.userId })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.role, "admin"),
        ),
      );
    if (adminRows.length <= 1 && adminRows.some((r) => r.userId === userId)) {
      return { ok: false, error: "The workspace must keep at least one admin" };
    }
  }
  await db
    .update(workspaceMember)
    .set({ role })
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    );
  const members = await fetchWorkspaceMembers(workspaceId);
  const member = members.find((m) => m.id === userId);
  if (!member) {
    return { ok: false, error: "Could not update member" };
  }
  return { ok: true, member };
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<MemberActionResult> {
  const memberships = await db
    .select()
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .limit(1);
  const membership = memberships[0];
  if (!membership) {
    return { ok: false, error: "User is not a member" };
  }
  if (membership.role === "admin") {
    const adminRows = await db
      .select({ userId: workspaceMember.userId })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.workspaceId, workspaceId),
          eq(workspaceMember.role, "admin"),
        ),
      );
    if (adminRows.length <= 1) {
      return { ok: false, error: "The workspace must keep at least one admin" };
    }
  }
  await db
    .delete(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    );
  return {
    ok: true,
    member: {
      ...avatarUserFor({ id: userId, name: "", email: "" }),
      email: "",
      role: membership.role,
      joinedAt: membership.joinedAt.getTime(),
    },
  };
}

export async function renameWorkspace(
  workspaceId: string,
  name: string,
): Promise<boolean> {
  const rows = await db
    .update(workspace)
    .set({ name })
    .where(eq(workspace.id, workspaceId))
    .returning({ id: workspace.id });
  return rows.length > 0;
}

export async function updateWorkspaceLogo(
  workspaceId: string,
  logo: string | null,
): Promise<boolean> {
  const rows = await db
    .update(workspace)
    .set({ logo })
    .where(eq(workspace.id, workspaceId))
    .returning({ id: workspace.id });
  return rows.length > 0;
}

export async function deleteWorkspaceById(workspaceId: string): Promise<void> {
  const rows = await db
    .select({ storedName: file.storedName })
    .from(file)
    .where(eq(file.workspaceId, workspaceId));
  await db.delete(workspace).where(eq(workspace.id, workspaceId));
  const storedNames = rows.map((row) => row.storedName);
  if (storedNames.length > 0) {
    await new UTApi().deleteFiles(storedNames).catch(() => {});
  }
}

import { NextResponse } from "next/server";

import {
  getSessionWorkspace,
  inviteMemberByEmail,
  removeWorkspaceMember,
  setMemberRole,
} from "@/lib/workspace-data";
import type {
  InviteMemberInput,
  RemoveMemberInput,
  UpdateMemberInput,
} from "@/lib/workspace-types";

export async function POST(request: Request) {
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  let input: InviteMemberInput;
  try {
    input = (await request.json()) as InviteMemberInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  const email = typeof input.email === "string" ? input.email.trim() : "";
  if (email.length === 0 || !email.includes("@")) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }
  const result = await inviteMemberByEmail(context.workspaceId, email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ member: result.member }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  let input: UpdateMemberInput;
  try {
    input = (await request.json()) as UpdateMemberInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (typeof input.userId !== "string" || input.userId.length === 0) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (input.role !== "admin" && input.role !== "member") {
    return NextResponse.json({ error: "invalid role" }, { status: 400 });
  }
  const result = await setMemberRole(
    context.workspaceId,
    input.userId,
    input.role,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ member: result.member });
}

export async function DELETE(request: Request) {
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  let input: RemoveMemberInput;
  try {
    input = (await request.json()) as RemoveMemberInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  if (typeof input.userId !== "string" || input.userId.length === 0) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const result = await removeWorkspaceMember(context.workspaceId, input.userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

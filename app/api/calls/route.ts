import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { createCall, listCalls } from "@/lib/call-data";
import type {
  CallsResponse,
  CreateCallInput,
  CreateCallResponse,
} from "@/lib/call-types";
import { getSessionUser } from "@/lib/chat-data";
import {
  getSessionWorkspace,
  previewWorkspaceId,
  workspaceMemberIds,
} from "@/lib/workspace-data";

export async function GET() {
  const self = await getSessionUser();
  const context = await getSessionWorkspace();
  const workspaceId = context?.workspaceId ?? (await previewWorkspaceId());
  const calls = await listCalls(
    self?.id ?? null,
    workspaceId,
    context?.isAdmin ?? false,
  );
  return NextResponse.json<CallsResponse>({
    calls,
    isPreview: self === null,
    isAdmin: context?.isAdmin ?? false,
  });
}

export async function POST(request: Request) {
  const self = await getSessionUser();
  if (!self) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "No workspace" }, { status: 403 });
  }
  const body = (await request.json()) as CreateCallInput;
  const memberIds = Array.isArray(body.memberIds)
    ? [...new Set(body.memberIds)].filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      )
    : [];
  if (memberIds.length > 0) {
    const workspaceMembers = await workspaceMemberIds(context.workspaceId);
    const found = await db
      .select({ id: user.id })
      .from(user)
      .where(inArray(user.id, memberIds));
    const validIds = new Set(
      found
        .filter((row) => workspaceMembers.includes(row.id))
        .map((row) => row.id),
    );
    for (const id of memberIds) {
      if (!validIds.has(id)) {
        return NextResponse.json({ error: "Unknown member" }, { status: 400 });
      }
    }
  }

  const callId = await createCall(
    self.id,
    context.workspaceId,
    memberIds.filter((id) => id !== self.id),
  );
  return NextResponse.json<CreateCallResponse>({ callId }, { status: 201 });
}

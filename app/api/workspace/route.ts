import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { workspace } from "@/db/workspace";
import {
  deleteWorkspaceById,
  fetchWorkspaceMembers,
  getSessionWorkspace,
  renameWorkspace,
  updateWorkspaceLogo,
} from "@/lib/workspace-data";
import type {
  UpdateWorkspaceInput,
  WorkspaceResponse,
} from "@/lib/workspace-types";

const MAX_NAME_LENGTH = 60;

export async function GET() {
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const rows = await db
    .select()
    .from(workspace)
    .where(eq(workspace.id, context.workspaceId))
    .limit(1);
  if (!rows[0]) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const members = await fetchWorkspaceMembers(context.workspaceId);
  return NextResponse.json<WorkspaceResponse>({
    workspace: {
      id: rows[0].id,
      name: rows[0].name,
      logo: rows[0].logo,
      createdAt: rows[0].createdAt.getTime(),
    },
    me: {
      role: context.role,
      isAdmin: context.isAdmin,
    },
    members,
  });
}

export async function PATCH(request: Request) {
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  let input: UpdateWorkspaceInput;
  try {
    input = (await request.json()) as UpdateWorkspaceInput;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
  let name: string | undefined;
  if (typeof input.name === "string") {
    name = input.name.trim();
    if (name.length === 0) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: "name is too long" }, { status: 400 });
    }
    const updated = await renameWorkspace(context.workspaceId, name);
    if (!updated) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }
  }
  let logo: string | null | undefined;
  if ("logo" in input) {
    logo =
      typeof input.logo === "string" && input.logo.length > 0
        ? input.logo.slice(0, 500)
        : null;
    const updated = await updateWorkspaceLogo(context.workspaceId, logo);
    if (!updated) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 },
      );
    }
  }
  if (name === undefined && logo === undefined) {
    return NextResponse.json(
      { error: "name or logo is required" },
      { status: 400 },
    );
  }
  return NextResponse.json({ name, logo });
}

export async function DELETE() {
  const context = await getSessionWorkspace();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!context.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }
  await deleteWorkspaceById(context.workspaceId);
  return NextResponse.json({ ok: true });
}

import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { previewWorkspaceId, workspaceForUser } from "@/lib/workspace-data";

const TOKEN_TTL_SECONDS = 60;

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

async function signToken(
  payload: Record<string, unknown>,
  secret: string,
): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${Buffer.from(signature).toString("base64url")}`;
}

export async function GET() {
  const secret = process.env.WS_AUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Realtime is not configured" },
      { status: 500 },
    );
  }

  let sub = "guest";
  let name = "Guest";
  let email = "";
  let workspaceId: string | null = null;

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user) {
    sub = session.user.id;
    name = session.user.name ?? "Guest";
    email = session.user.email ?? "";
    workspaceId = (await workspaceForUser(sub, name)).workspaceId;
  } else {
    workspaceId = await previewWorkspaceId();
  }

  const token = await signToken(
    {
      sub,
      name,
      email,
      workspaceId: workspaceId ?? "guest",
      exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    },
    secret,
  );
  return NextResponse.json({ token });
}

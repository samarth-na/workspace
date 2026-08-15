import { randomUUID } from "node:crypto";
import { createServer } from "node:http";

import { and, eq } from "drizzle-orm";
import { Server } from "socket.io";

import { db } from "@/db";
import {
  conversation,
  conversationMember,
  message,
  messageReaction,
} from "@/db/chat";
import { auth } from "@/lib/auth";
import {
  aggregateReactions,
  conversationBelongsToWorkspace,
  fetchReactionRows,
  isMember,
  type SessionUser,
  toChatMessage,
} from "@/lib/chat-data";
import {
  type ChatMessage,
  MAX_MESSAGE_LENGTH,
  type MessageReaction,
} from "@/lib/chat-types";
import type {
  MeetingIceCandidate,
  MeetingPeer,
  MeetingPeerState,
  MeetingSignalDescription,
} from "@/lib/meeting-types";
import { previewWorkspaceId, workspaceForUser } from "@/lib/workspace-data";

type SocketData = {
  user: SessionUser | null;
  workspaceId: string | null;
};

type ClientToServerEvents = {
  "chat:join": (payload: { conversationIds: string[] }) => void;
  "message:send": (payload: {
    conversationId: string;
    body: string;
    clientId: string;
  }) => void;
  "reaction:toggle": (payload: {
    conversationId: string;
    messageId: string;
    emoji: string;
  }) => void;
  typing: (payload: { conversationId: string; isTyping: boolean }) => void;
  "meeting:join-room": (payload: {
    meetingId: string;
    name: string;
    muted: boolean;
    cameraOn: boolean;
  }) => void;
  "meeting:leave-room": (payload: { meetingId: string }) => void;
  "meeting:state": (payload: {
    meetingId: string;
    muted: boolean;
    cameraOn: boolean;
    sharing: boolean;
  }) => void;
  "meeting:offer": (payload: {
    meetingId: string;
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:answer": (payload: {
    meetingId: string;
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:ice": (payload: {
    meetingId: string;
    peerId: string;
    candidate: MeetingIceCandidate;
  }) => void;
};

type ServerToClientEvents = {
  "message:new": (payload: { message: ChatMessage }) => void;
  "message:sent": (payload: { clientId: string; message: ChatMessage }) => void;
  "message:failed": (payload: {
    clientId: string;
    conversationId: string;
    reason: string;
  }) => void;
  "reaction:update": (payload: {
    conversationId: string;
    messageId: string;
    reactions: MessageReaction[];
  }) => void;
  typing: (payload: {
    conversationId: string;
    userId: string;
    name: string;
  }) => void;
  "conversations:changed": (payload: Record<string, never>) => void;
  "meeting:peers": (payload: { peers: MeetingPeer[] }) => void;
  "meeting:peer-joined": (payload: { peer: MeetingPeer }) => void;
  "meeting:peer-left": (payload: { peerId: string }) => void;
  "meeting:peer-state": (payload: MeetingPeerState) => void;
  "meeting:offer": (payload: {
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:answer": (payload: {
    peerId: string;
    description: MeetingSignalDescription;
  }) => void;
  "meeting:ice": (payload: {
    peerId: string;
    candidate: MeetingIceCandidate;
  }) => void;
};

function roomFor(conversationId: string): string {
  return `conv:${conversationId}`;
}

function meetingRoomFor(meetingId: string): string {
  return `meeting:${meetingId}`;
}

const meetingPeers = new Map<string, Map<string, MeetingPeer>>();

function meetingPeersFor(meetingId: string): Map<string, MeetingPeer> {
  let peers = meetingPeers.get(meetingId);
  if (!peers) {
    peers = new Map();
    meetingPeers.set(meetingId, peers);
  }
  return peers;
}

const httpServer = createServer();
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>(httpServer, {
  cors: { origin: true, credentials: true },
});

io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie;
    let user: SessionUser | null = null;
    let workspaceId: string | null = null;
    if (cookie) {
      const session = await auth.api.getSession({
        headers: new Headers({ cookie }),
      });
      if (session?.user) {
        user = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        };
        workspaceId = (await workspaceForUser(user.id, user.name)).workspaceId;
      }
    }
    if (!workspaceId) {
      workspaceId = await previewWorkspaceId();
    }
    socket.data.user = user;
    socket.data.workspaceId = workspaceId;
    next();
  } catch (err) {
    console.error("[ws] session validation failed:", err);
    next(new Error("session validation failed"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user;
  if (user) socket.join(`user:${user.id}`);

  socket.on("chat:join", async (payload) => {
    try {
      const workspaceId = socket.data.workspaceId;
      const ids = payload.conversationIds;
      for (const id of ids) {
        if (typeof id !== "string") continue;
        if (user && !(await isMember(user.id, id))) continue;
        if (
          workspaceId &&
          !(await conversationBelongsToWorkspace(id, workspaceId))
        ) {
          continue;
        }
        await socket.join(roomFor(id));
      }
    } catch (err) {
      console.error("[ws] chat:join failed:", err);
    }
  });

  socket.on("message:send", async (payload) => {
    const clientId = payload.clientId;
    const conversationId = payload.conversationId;
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    const fail = (reason: string) =>
      socket.emit("message:failed", { clientId, conversationId, reason });

    try {
      if (!user) {
        fail("Unauthorized");
        return;
      }
      if (typeof clientId !== "string" || clientId.length === 0) return;
      if (typeof conversationId !== "string" || conversationId.length === 0) {
        fail("Invalid conversation");
        return;
      }
      if (body.length === 0) {
        fail("Message body is empty");
        return;
      }
      if (body.length > MAX_MESSAGE_LENGTH) {
        fail("Message is too long");
        return;
      }
      const convRows = await db
        .select()
        .from(conversation)
        .where(eq(conversation.id, conversationId))
        .limit(1);
      if (!convRows[0]) {
        fail("Conversation not found");
        return;
      }
      const workspaceId = socket.data.workspaceId;
      if (
        workspaceId &&
        !(await conversationBelongsToWorkspace(conversationId, workspaceId))
      ) {
        fail("Forbidden");
        return;
      }
      if (!(await isMember(user.id, conversationId))) {
        fail("Not a member");
        return;
      }

      const now = new Date();
      const id = randomUUID();
      await db.insert(message).values({
        id,
        conversationId,
        senderId: user.id,
        body,
        createdAt: now,
      });
      await db
        .update(conversation)
        .set({ updatedAt: now })
        .where(eq(conversation.id, conversationId));
      await db
        .update(conversationMember)
        .set({ lastReadAt: now })
        .where(
          and(
            eq(conversationMember.conversationId, conversationId),
            eq(conversationMember.userId, user.id),
          ),
        );

      const chatMessage = toChatMessage(
        {
          id,
          conversationId,
          senderId: user.id,
          body,
          createdAt: now,
          senderName: user.name,
          senderEmail: user.email,
        },
        [],
      );

      io.to(roomFor(conversationId)).emit("message:new", {
        message: chatMessage,
      });
      socket.emit("message:sent", { clientId, message: chatMessage });
      io.to(roomFor(conversationId)).emit("conversations:changed", {});
      const memberRows = await db
        .select({ userId: conversationMember.userId })
        .from(conversationMember)
        .where(eq(conversationMember.conversationId, conversationId));
      for (const member of memberRows) {
        io.to(`user:${member.userId}`).emit("conversations:changed", {});
      }
    } catch (err) {
      console.error("[ws] message:send failed:", err);
      if (typeof clientId === "string") {
        socket.emit("message:failed", {
          clientId,
          conversationId,
          reason: "Internal error",
        });
      }
    }
  });

  socket.on("reaction:toggle", async (payload) => {
    if (!user) return;
    const { conversationId, messageId, emoji } = payload;
    try {
      const workspaceId = socket.data.workspaceId;
      if (
        workspaceId &&
        !(await conversationBelongsToWorkspace(conversationId, workspaceId))
      ) {
        return;
      }
      const msgRows = await db
        .select()
        .from(message)
        .where(
          and(
            eq(message.id, messageId),
            eq(message.conversationId, conversationId),
          ),
        )
        .limit(1);
      if (!msgRows[0]) return;
      if (!(await isMember(user.id, conversationId))) return;

      const existing = await db
        .select()
        .from(messageReaction)
        .where(
          and(
            eq(messageReaction.messageId, messageId),
            eq(messageReaction.userId, user.id),
            eq(messageReaction.emoji, emoji),
          ),
        )
        .limit(1);
      if (existing[0]) {
        await db
          .delete(messageReaction)
          .where(
            and(
              eq(messageReaction.messageId, messageId),
              eq(messageReaction.userId, user.id),
              eq(messageReaction.emoji, emoji),
            ),
          );
      } else {
        await db.insert(messageReaction).values({
          messageId,
          userId: user.id,
          emoji,
          createdAt: new Date(),
        });
      }

      const rows = (await fetchReactionRows([messageId])).get(messageId) ?? [];
      const reactions = aggregateReactions(rows, user.id);
      io.to(roomFor(conversationId)).emit("reaction:update", {
        conversationId,
        messageId,
        reactions,
      });
    } catch (err) {
      console.error("[ws] reaction:toggle failed:", err);
    }
  });

  socket.on("typing", async (payload) => {
    if (!user) return;
    const { conversationId, isTyping } = payload;
    try {
      if (typeof isTyping !== "boolean") return;
      if (typeof conversationId !== "string" || conversationId.length === 0)
        return;
      const workspaceId = socket.data.workspaceId;
      if (
        workspaceId &&
        !(await conversationBelongsToWorkspace(conversationId, workspaceId))
      ) {
        return;
      }
      if (!(await isMember(user.id, conversationId))) return;
      socket
        .to(roomFor(conversationId))
        .emit("typing", { conversationId, userId: user.id, name: user.name });
    } catch (err) {
      console.error("[ws] typing failed:", err);
    }
  });

  socket.on("meeting:join-room", (payload) => {
    const meetingId = payload?.meetingId;
    if (typeof meetingId !== "string" || meetingId.length === 0) return;
    const name =
      typeof payload?.name === "string" && payload.name.trim().length > 0
        ? payload.name.trim().slice(0, 60)
        : (user?.name ?? "Guest");
    const muted = payload?.muted === true;
    const cameraOn = payload?.cameraOn !== false;
    const peer: MeetingPeer = {
      peerId: socket.id,
      userId: user?.id ?? null,
      name,
      muted,
      cameraOn,
      sharing: false,
    };
    const peers = meetingPeersFor(meetingId);
    peers.set(socket.id, peer);
    socket.join(meetingRoomFor(meetingId));
    socket.emit("meeting:peers", { peers: [...peers.values()] });
    socket.to(meetingRoomFor(meetingId)).emit("meeting:peer-joined", { peer });
  });

  socket.on("meeting:leave-room", (payload) => {
    const meetingId = payload?.meetingId;
    if (typeof meetingId !== "string" || meetingId.length === 0) return;
    const peers = meetingPeers.get(meetingId);
    if (peers?.delete(socket.id)) {
      socket
        .to(meetingRoomFor(meetingId))
        .emit("meeting:peer-left", { peerId: socket.id });
    }
  });

  socket.on("meeting:state", (payload) => {
    const meetingId = payload?.meetingId;
    if (typeof meetingId !== "string" || meetingId.length === 0) return;
    const peers = meetingPeers.get(meetingId);
    const peer = peers?.get(socket.id);
    if (!peer) return;
    const muted = payload?.muted === true;
    const cameraOn = payload?.cameraOn !== false;
    const sharing = payload?.sharing === true;
    peer.muted = muted;
    peer.cameraOn = cameraOn;
    peer.sharing = sharing;
    socket.to(meetingRoomFor(meetingId)).emit("meeting:peer-state", {
      peerId: socket.id,
      muted,
      cameraOn,
      sharing,
    });
  });

  const forwardSignal = (
    event: "meeting:offer" | "meeting:answer" | "meeting:ice",
    payload: {
      meetingId?: unknown;
      peerId?: unknown;
      description?: unknown;
      candidate?: unknown;
    },
  ) => {
    if (
      typeof payload?.meetingId !== "string" ||
      typeof payload?.peerId !== "string"
    ) {
      return;
    }
    const peers = meetingPeers.get(payload.meetingId);
    if (!peers?.has(payload.peerId)) return;
    if (event === "meeting:ice") {
      if (typeof payload.candidate !== "object" || payload.candidate === null) {
        return;
      }
      io.to(payload.peerId).emit(event, {
        peerId: socket.id,
        candidate: payload.candidate as MeetingIceCandidate,
      });
      return;
    }
    if (
      typeof payload.description !== "object" ||
      payload.description === null
    ) {
      return;
    }
    const description = payload.description as MeetingSignalDescription;
    if (
      typeof description.type !== "string" ||
      typeof description.sdp !== "string"
    ) {
      return;
    }
    io.to(payload.peerId).emit(event, {
      peerId: socket.id,
      description,
    });
  };

  socket.on("meeting:offer", (payload) =>
    forwardSignal("meeting:offer", payload),
  );
  socket.on("meeting:answer", (payload) =>
    forwardSignal("meeting:answer", payload),
  );
  socket.on("meeting:ice", (payload) => forwardSignal("meeting:ice", payload));

  socket.on("disconnect", () => {
    for (const [meetingId, peers] of meetingPeers) {
      if (peers.delete(socket.id)) {
        socket
          .to(meetingRoomFor(meetingId))
          .emit("meeting:peer-left", { peerId: socket.id });
      }
    }
  });
});

const port = Number(process.env.WS_PORT ?? 3001);
httpServer.listen(port, () => {
  console.log(`ws chat server listening on :${port}`);
});

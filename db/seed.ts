import { randomUUID } from "node:crypto";

import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  conversation,
  conversationMember,
  message,
  messageReaction,
} from "@/db/chat";
import { meeting, meetingMember } from "@/db/meetings";
import { user } from "@/db/schema";
import { project, task, type taskPriority, type taskStatus } from "@/db/tasks";

const DEMO_USERS = [
  { id: "u-samarth", email: "samarth@cedar.co", name: "Samarth" },
  { id: "u-maya", email: "maya@cedar.co", name: "Maya Chen" },
  { id: "u-jordan", email: "jordan@cedar.co", name: "Jordan Lee" },
  { id: "u-priya", email: "priya@cedar.co", name: "Priya Shah" },
  { id: "u-alex", email: "alex@cedar.co", name: "Alex Morgan" },
];

const CHANNELS = [
  {
    id: "conv-channel-product",
    name: "# product",
    topic: "Launch planning and product updates",
  },
  {
    id: "conv-channel-design",
    name: "# design",
    topic: "Critique, research, and design systems",
  },
  {
    id: "conv-channel-random",
    name: "# random",
    topic: "Watercooler and team chatter",
  },
];

const DM_IDS = [
  ["conv-dm-samarth-maya", ["u-samarth", "u-maya"]],
  ["conv-dm-samarth-jordan", ["u-samarth", "u-jordan"]],
  ["conv-dm-samarth-priya", ["u-samarth", "u-priya"]],
  ["conv-dm-samarth-alex", ["u-samarth", "u-alex"]],
] as const;

type SeedMessage = {
  senderId: string;
  body: string;
  minutesAgo: number;
};

const CHANNEL_MESSAGES: Record<string, SeedMessage[]> = {
  "conv-channel-product": [
    {
      senderId: "u-maya",
      body: "The new onboarding flow is ready for a final pass. I added the latest notes to the shared brief.",
      minutesAgo: 482,
    },
    {
      senderId: "u-jordan",
      body: "Looks good from engineering. I can pair on the handoff after the sync.",
      minutesAgo: 458,
    },
    {
      senderId: "u-priya",
      body: "Can we schedule a quick walkthrough before it ships? I want to check the empty states.",
      minutesAgo: 431,
    },
    {
      senderId: "u-samarth",
      body: "Added a few notes to the brief, mainly around the activation emails.",
      minutesAgo: 402,
    },
    {
      senderId: "u-maya",
      body: "Saw those — let's fold them into the QA checklist.",
      minutesAgo: 376,
    },
    {
      senderId: "u-jordan",
      body: "QA is green on my side. The status pill fix shipped earlier today.",
      minutesAgo: 345,
    },
    {
      senderId: "u-priya",
      body: "Locking the milestone for Friday. Ping me if anything else lands.",
      minutesAgo: 311,
    },
    {
      senderId: "u-maya",
      body: "Release notes draft is up in the shared doc for a final pass.",
      minutesAgo: 42,
    },
  ],
  "conv-channel-design": [
    {
      senderId: "u-maya",
      body: "Posting the moodboard updates before critique at 1:00.",
      minutesAgo: 210,
    },
    {
      senderId: "u-jordan",
      body: "Nice, I'll bring the lo-fi variants from yesterday's session.",
      minutesAgo: 188,
    },
    {
      senderId: "u-priya",
      body: "Can you add the new color ramp to the board? The palette shifted.",
      minutesAgo: 154,
    },
    {
      senderId: "u-maya",
      body: "Done — the ramp is in the last section. Link is in the thread.",
      minutesAgo: 35,
    },
  ],
  "conv-channel-random": [
    {
      senderId: "u-alex",
      body: "Coffee machine on 3 is fixed. You're welcome.",
      minutesAgo: 265,
    },
    {
      senderId: "u-maya",
      body: "Hero of the week, honestly.",
      minutesAgo: 241,
    },
    {
      senderId: "u-jordan",
      body: "Does that mean the kettle on 2 is next? Asking for a friend.",
      minutesAgo: 217,
    },
    {
      senderId: "u-alex",
      body: "Put it on the board, I'll get to it before standup.",
      minutesAgo: 28,
    },
  ],
  "conv-dm-samarth-maya": [
    {
      senderId: "u-samarth",
      body: "Did you catch my notes on the onboarding brief?",
      minutesAgo: 153,
    },
    {
      senderId: "u-maya",
      body: "Just did. The activation email points are spot on.",
      minutesAgo: 147,
    },
    {
      senderId: "u-samarth",
      body: "Want to pair on the handoff tomorrow morning?",
      minutesAgo: 96,
    },
    {
      senderId: "u-maya",
      body: "Sure, 10 works. I'll grab a room.",
      minutesAgo: 88,
    },
    {
      senderId: "u-samarth",
      body: "Perfect. I'll bring the release notes draft.",
      minutesAgo: 18,
    },
  ],
  "conv-dm-samarth-jordan": [
    {
      senderId: "u-jordan",
      body: "Sprint planning moved to 9:30, not 10.",
      minutesAgo: 122,
    },
    {
      senderId: "u-samarth",
      body: "Got it — I'll shift my standup notes.",
      minutesAgo: 115,
    },
    {
      senderId: "u-jordan",
      body: "Also, can you take the status pill ticket?",
      minutesAgo: 74,
    },
    {
      senderId: "u-samarth",
      body: "Yep, already in my queue.",
      minutesAgo: 66,
    },
  ],
  "conv-dm-samarth-priya": [
    {
      senderId: "u-priya",
      body: "Can you review the empty states when you get a sec?",
      minutesAgo: 138,
    },
    {
      senderId: "u-samarth",
      body: "On it after standup.",
      minutesAgo: 130,
    },
    {
      senderId: "u-priya",
      body: "Great, I'll leave the branch up.",
      minutesAgo: 58,
    },
    {
      senderId: "u-samarth",
      body: "Looks solid — left a couple of comments.",
      minutesAgo: 24,
    },
  ],
  "conv-dm-samarth-alex": [
    {
      senderId: "u-alex",
      body: "The deploy pipeline is green again.",
      minutesAgo: 107,
    },
    {
      senderId: "u-samarth",
      body: "Was it the cache invalidation?",
      minutesAgo: 99,
    },
    {
      senderId: "u-alex",
      body: "Yeah, cleared it and it rebuilt clean.",
      minutesAgo: 89,
    },
  ],
};

const REACTIONS = [
  { conversationId: "conv-channel-product", messageIndex: 0 },
  { conversationId: "conv-channel-product", messageIndex: 1 },
  { conversationId: "conv-channel-product", messageIndex: 5 },
  { conversationId: "conv-channel-design", messageIndex: 0 },
  { conversationId: "conv-channel-random", messageIndex: 0 },
  { conversationId: "conv-dm-samarth-maya", messageIndex: 1 },
  { conversationId: "conv-dm-samarth-jordan", messageIndex: 0 },
] as const;

const summary = {
  usersCreated: 0,
  usersSkipped: 0,
  channelsCreated: 0,
  channelsSkipped: 0,
  membersAdded: 0,
  membersSkipped: 0,
  dmsCreated: 0,
  dmsSkipped: 0,
  conversationsSeeded: 0,
  conversationsSkipped: 0,
  messagesSeeded: 0,
  reactionsAdded: 0,
  lastReadUpdated: 0,
  projectsCreated: 0,
  projectsSkipped: 0,
  tasksCreated: 0,
  tasksSkipped: 0,
  meetingsCreated: 0,
  meetingsSkipped: 0,
  meetingMembersAdded: 0,
  meetingMembersSkipped: 0,
};

function minutesAgo(n: number) {
  return new Date(Date.now() - n * 60_000);
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

async function ensureMember(conversationId: string, memberId: string) {
  const existing = await db
    .select()
    .from(conversationMember)
    .where(
      and(
        eq(conversationMember.conversationId, conversationId),
        eq(conversationMember.userId, memberId),
      ),
    )
    .get();
  if (existing) {
    summary.membersSkipped += 1;
    return;
  }
  await db
    .insert(conversationMember)
    .values({ conversationId, userId: memberId })
    .onConflictDoNothing();
  summary.membersAdded += 1;
}

async function seedUsers() {
  for (const demo of DEMO_USERS) {
    const existing = await db
      .select()
      .from(user)
      .where(eq(user.email, demo.email))
      .get();
    if (existing) {
      summary.usersSkipped += 1;
      continue;
    }
    await db
      .insert(user)
      .values({
        id: demo.id,
        name: demo.name,
        email: demo.email,
        emailVerified: true,
      })
      .onConflictDoNothing();
    summary.usersCreated += 1;
  }
}

async function ensureConversation(
  id: string,
  type: "dm" | "channel",
  name: string | null,
  topic: string | null,
  memberIds: string[],
) {
  let existing = await db
    .select()
    .from(conversation)
    .where(eq(conversation.id, id))
    .get();
  const isChannel = type === "channel";
  let convId = id;
  if (!existing && isChannel && name) {
    existing = await db
      .select()
      .from(conversation)
      .where(eq(conversation.name, name))
      .get();
    if (existing) {
      convId = existing.id;
    }
  }
  if (existing) {
    if (isChannel) summary.channelsSkipped += 1;
    else summary.dmsSkipped += 1;
  } else {
    await db.insert(conversation).values({ id, type, name, topic });
    if (isChannel) summary.channelsCreated += 1;
    else summary.dmsCreated += 1;
  }
  for (const memberId of memberIds) {
    await ensureMember(convId, memberId);
  }
  return convId;
}

async function seedMessages(convId: string, rows: SeedMessage[]) {
  const count = await db.$count(message, eq(message.conversationId, convId));
  if (count > 0) {
    summary.conversationsSkipped += 1;
    return;
  }
  for (const row of rows) {
    await db.insert(message).values({
      id: randomUUID(),
      conversationId: convId,
      senderId: row.senderId,
      body: row.body,
      createdAt: minutesAgo(row.minutesAgo),
    });
  }
  summary.conversationsSeeded += 1;
  summary.messagesSeeded += rows.length;
}

function reactionSetFor(conversationId: string) {
  switch (conversationId) {
    case "conv-channel-product":
      return [
        { emoji: "👍", userId: "u-jordan" },
        { emoji: "❤️", userId: "u-samarth" },
      ];
    case "conv-channel-design":
      return [
        { emoji: "❤️", userId: "u-priya" },
        { emoji: "👍", userId: "u-jordan" },
      ];
    case "conv-channel-random":
      return [
        { emoji: "🎉", userId: "u-samarth" },
        { emoji: "❤️", userId: "u-maya" },
        { emoji: "🎉", userId: "u-priya" },
      ];
    case "conv-dm-samarth-maya":
      return [
        { emoji: "👍", userId: "u-samarth" },
        { emoji: "❤️", userId: "u-maya" },
      ];
    default:
      return [
        { emoji: "👍", userId: "u-samarth" },
        { emoji: "🎉", userId: "u-jordan" },
      ];
  }
}

async function seedReactions(conversationId: string, index: number) {
  const rows = CHANNEL_MESSAGES[conversationId];
  if (!rows) return;
  const target = await db
    .select()
    .from(message)
    .where(
      and(
        eq(message.conversationId, conversationId),
        eq(message.body, rows[index].body),
      ),
    )
    .get();
  if (!target) return;
  for (const reaction of reactionSetFor(conversationId)) {
    const existing = await db
      .select()
      .from(messageReaction)
      .where(
        and(
          eq(messageReaction.messageId, target.id),
          eq(messageReaction.userId, reaction.userId),
          eq(messageReaction.emoji, reaction.emoji),
        ),
      )
      .get();
    if (existing) continue;
    await db.insert(messageReaction).values({
      messageId: target.id,
      userId: reaction.userId,
      emoji: reaction.emoji,
    });
    summary.reactionsAdded += 1;
  }
}

const PROJECTS = [
  { id: "p-launch", name: "Q3 Launch", color: "#5b64d6" },
  { id: "p-design-system", name: "Design System", color: "#d97757" },
  { id: "p-platform", name: "Platform", color: "#4caf7d" },
  { id: "p-growth", name: "Growth", color: "#c2913c" },
];

type SeedTask = {
  id: string;
  title: string;
  description?: string;
  status: (typeof taskStatus)[number];
  priority: (typeof taskPriority)[number];
  projectId?: string;
  assigneeId: string;
  dueInDays?: number;
  startInDays?: number;
};

const SEED_TASKS: SeedTask[] = [
  {
    id: "task-launch-onboarding",
    title: "Finalize onboarding flow",
    description:
      "Apply the latest notes from the shared brief and lock the copy.",
    status: "in-progress",
    priority: "high",
    projectId: "p-launch",
    assigneeId: "u-maya",
    dueInDays: 2,
    startInDays: -1,
  },
  {
    id: "task-launch-release-notes",
    title: "Write release notes draft",
    description: "Draft is up in the shared doc, fold in QA results.",
    status: "in-review",
    priority: "medium",
    projectId: "p-launch",
    assigneeId: "u-samarth",
    dueInDays: 3,
    startInDays: -2,
  },
  {
    id: "task-launch-qa",
    title: "QA checklist for launch",
    description: "Cover the activation emails and empty states.",
    status: "todo",
    priority: "high",
    projectId: "p-launch",
    assigneeId: "u-jordan",
    dueInDays: 4,
  },
  {
    id: "task-launch-email-copy",
    title: "Activation email copy",
    description: "Three variants for the welcome sequence.",
    status: "todo",
    priority: "medium",
    projectId: "p-launch",
    assigneeId: "u-priya",
    dueInDays: 5,
    startInDays: 1,
  },
  {
    id: "task-launch-announcement",
    title: "Launch announcement post",
    description: "Internal + external versions for launch week.",
    status: "backlog",
    priority: "low",
    projectId: "p-launch",
    assigneeId: "u-maya",
    dueInDays: 9,
  },
  {
    id: "task-launch-status-pill",
    title: "Status pill fix",
    description: "The status pill update shipped earlier today.",
    status: "done",
    priority: "high",
    projectId: "p-launch",
    assigneeId: "u-jordan",
    dueInDays: -3,
    startInDays: -6,
  },
  {
    id: "task-launch-empty-states",
    title: "Empty states review",
    description: "Checked against the new color ramp.",
    status: "done",
    priority: "low",
    projectId: "p-launch",
    assigneeId: "u-priya",
    dueInDays: -1,
    startInDays: -4,
  },
  {
    id: "task-launch-handoff",
    title: "Pair on handoff notes",
    description: "Walk through the engineering handoff before it ships.",
    status: "todo",
    priority: "low",
    projectId: "p-launch",
    assigneeId: "u-samarth",
    dueInDays: 0,
  },
  {
    id: "task-ds-color-ramp",
    title: "Color ramp v2",
    description: "The palette shifted — update the board and tokens.",
    status: "in-progress",
    priority: "high",
    projectId: "p-design-system",
    assigneeId: "u-maya",
    dueInDays: 1,
    startInDays: -2,
  },
  {
    id: "task-ds-typography",
    title: "Typography scale audit",
    description: "Check usage against the new type tokens.",
    status: "todo",
    priority: "medium",
    projectId: "p-design-system",
    assigneeId: "u-priya",
    dueInDays: 6,
  },
  {
    id: "task-ds-api-review",
    title: "Component API review",
    description: "Left a couple of comments, mostly around props.",
    status: "in-review",
    priority: "medium",
    projectId: "p-design-system",
    assigneeId: "u-alex",
    dueInDays: -1,
    startInDays: -5,
  },
  {
    id: "task-ds-a11y",
    title: "Accessibility pass",
    description: "Keyboard nav and focus states across components.",
    status: "backlog",
    priority: "high",
    projectId: "p-design-system",
    assigneeId: "u-maya",
    dueInDays: 12,
  },
  {
    id: "task-ds-moodboard",
    title: "Moodboard critique notes",
    description: "Notes from the 1:00 critique session.",
    status: "done",
    priority: "none",
    projectId: "p-design-system",
    assigneeId: "u-maya",
    dueInDays: -2,
    startInDays: -4,
  },
  {
    id: "task-platform-cache",
    title: "Cache invalidation fix",
    description: "Cleared and rebuilt clean, monitor the pipeline.",
    status: "in-progress",
    priority: "urgent",
    projectId: "p-platform",
    assigneeId: "u-alex",
    dueInDays: 1,
    startInDays: -3,
  },
  {
    id: "task-platform-pipeline",
    title: "Deploy pipeline green",
    description: "The pipeline rebuilt clean after the cache fix.",
    status: "done",
    priority: "high",
    projectId: "p-platform",
    assigneeId: "u-alex",
    dueInDays: -2,
    startInDays: -5,
  },
  {
    id: "task-platform-rate-limit",
    title: "Rate limit dashboard",
    description: "Expose per-route limits in the admin panel.",
    status: "todo",
    priority: "medium",
    projectId: "p-platform",
    assigneeId: "u-jordan",
    dueInDays: 8,
  },
  {
    id: "task-platform-auth-migration",
    title: "Migrate auth sessions",
    description: "Move session storage to the new table layout.",
    status: "backlog",
    priority: "medium",
    projectId: "p-platform",
    assigneeId: "u-alex",
    dueInDays: 15,
    startInDays: 2,
  },
  {
    id: "task-growth-referral",
    title: "Referral experiment setup",
    description: "Wire the invite flow into the experiment framework.",
    status: "todo",
    priority: "medium",
    projectId: "p-growth",
    assigneeId: "u-jordan",
    dueInDays: 7,
    startInDays: 1,
  },
  {
    id: "task-growth-metrics",
    title: "Activation metric dashboard",
    description: "First version of the activation funnel chart.",
    status: "backlog",
    priority: "low",
    projectId: "p-growth",
    assigneeId: "u-priya",
    dueInDays: 10,
  },
  {
    id: "task-growth-research",
    title: "Customer research synthesis",
    description: "Fold the interview notes into the brief.",
    status: "in-progress",
    priority: "high",
    projectId: "p-growth",
    assigneeId: "u-priya",
    dueInDays: 2,
    startInDays: -1,
  },
];

async function seedProjects() {
  for (const demo of PROJECTS) {
    const existing = await db
      .select()
      .from(project)
      .where(eq(project.id, demo.id))
      .get();
    if (existing) {
      summary.projectsSkipped += 1;
      continue;
    }
    await db.insert(project).values(demo).onConflictDoNothing();
    summary.projectsCreated += 1;
  }
}

async function seedTasks() {
  for (const demo of SEED_TASKS) {
    const existing = await db
      .select()
      .from(task)
      .where(eq(task.id, demo.id))
      .get();
    if (existing) {
      summary.tasksSkipped += 1;
      continue;
    }
    await db
      .insert(task)
      .values({
        id: demo.id,
        title: demo.title,
        description: demo.description ?? null,
        status: demo.status,
        priority: demo.priority,
        projectId: demo.projectId ?? null,
        assigneeId: demo.assigneeId,
        dueDate:
          demo.dueInDays !== undefined ? daysFromNow(demo.dueInDays) : null,
        startDate:
          demo.startInDays !== undefined ? daysFromNow(demo.startInDays) : null,
      })
      .onConflictDoNothing();
    summary.tasksCreated += 1;
  }
}

function atTime(date: Date, hour: number, minute: number): Date {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

type SeedMeeting = {
  id: string;
  title: string;
  description: string;
  status: "scheduled" | "live" | "ended";
  hostId: string | null;
  startsAt: Date;
  endsAt: Date | null;
  memberIds: string[];
};

const SEED_MEETINGS: SeedMeeting[] = [
  {
    id: "mt-weekly-sync",
    title: "Weekly product sync",
    description: "Walk the launch plan, check blockers, and assign owners.",
    status: "scheduled",
    hostId: "u-samarth",
    startsAt: atTime(daysFromNow(0), 10, 30),
    endsAt: null,
    memberIds: ["u-samarth", "u-maya", "u-jordan", "u-priya", "u-alex"],
  },
  {
    id: "mt-design-critique",
    title: "Design critique",
    description: "Feedback round on the onboarding flows and empty states.",
    status: "ended",
    hostId: "u-maya",
    startsAt: atTime(daysFromNow(-1), 13, 0),
    endsAt: new Date(atTime(daysFromNow(-1), 13, 0).getTime() + 42 * 60_000),
    memberIds: ["u-samarth", "u-maya", "u-jordan", "u-priya"],
  },
  {
    id: "mt-sprint-planning",
    title: "Sprint planning",
    description: "Break down the milestone into sprint-sized pieces.",
    status: "ended",
    hostId: "u-jordan",
    startsAt: atTime(daysFromNow(-2), 9, 30),
    endsAt: new Date(atTime(daysFromNow(-2), 9, 30).getTime() + 58 * 60_000),
    memberIds: ["u-samarth", "u-maya", "u-jordan", "u-priya", "u-alex"],
  },
  {
    id: "mt-customer-research",
    title: "Customer research",
    description: "Review findings from the latest round of interviews.",
    status: "ended",
    hostId: "u-priya",
    startsAt: atTime(daysFromNow(-3), 11, 0),
    endsAt: new Date(atTime(daysFromNow(-3), 11, 0).getTime() + 31 * 60_000),
    memberIds: ["u-priya", "u-maya", "u-alex"],
  },
];

async function seedMeetings() {
  for (const demo of SEED_MEETINGS) {
    const existing = await db
      .select()
      .from(meeting)
      .where(eq(meeting.id, demo.id))
      .get();
    if (existing) {
      summary.meetingsSkipped += 1;
      continue;
    }
    await db
      .insert(meeting)
      .values({
        id: demo.id,
        title: demo.title,
        description: demo.description,
        status: demo.status,
        hostId: demo.hostId,
        startsAt: demo.startsAt,
        endsAt: demo.endsAt,
      })
      .onConflictDoNothing();
    summary.meetingsCreated += 1;
    for (const memberId of demo.memberIds) {
      const member = await db
        .select()
        .from(meetingMember)
        .where(
          and(
            eq(meetingMember.meetingId, demo.id),
            eq(meetingMember.userId, memberId),
          ),
        )
        .get();
      if (member) {
        summary.meetingMembersSkipped += 1;
        continue;
      }
      await db
        .insert(meetingMember)
        .values({ meetingId: demo.id, userId: memberId })
        .onConflictDoNothing();
      summary.meetingMembersAdded += 1;
    }
  }
}

async function main() {
  const preExisting = await db.select().from(user);
  const preExistingIds = new Set(
    preExisting
      .filter((u) => !DEMO_USERS.some((d) => d.id === u.id))
      .map((u) => u.id),
  );

  await seedUsers();

  await seedProjects();
  await seedTasks();
  await seedMeetings();

  const allMemberIds = [...DEMO_USERS.map((d) => d.id), ...preExistingIds];

  for (const channel of CHANNELS) {
    const conv = await ensureConversation(
      channel.id,
      "channel",
      channel.name,
      channel.topic,
      allMemberIds,
    );
    const rows = CHANNEL_MESSAGES[conv];
    if (rows) await seedMessages(conv, rows);
    else summary.conversationsSkipped += 1;
  }

  for (const [dmId, memberIds] of DM_IDS) {
    const conv = await ensureConversation(dmId, "dm", null, null, [
      ...memberIds,
    ]);
    const rows = CHANNEL_MESSAGES[conv];
    if (rows) await seedMessages(conv, rows);
    else summary.conversationsSkipped += 1;
  }

  for (const reaction of REACTIONS) {
    await seedReactions(reaction.conversationId, reaction.messageIndex);
  }

  const conversations = await db.select().from(conversation);
  const newestTimes: Record<string, Date[]> = {};
  for (const conv of conversations) {
    const messages = await db
      .select({ createdAt: message.createdAt })
      .from(message)
      .where(eq(message.conversationId, conv.id))
      .orderBy(desc(message.createdAt));
    newestTimes[conv.id] = messages
      .map((m) => m.createdAt)
      .filter((t): t is Date => t instanceof Date);
  }

  const members = await db.select().from(conversationMember);
  for (const member of members) {
    const list = newestTimes[member.conversationId];
    if (!list || list.length === 0) continue;
    let lastReadAt: Date;
    if (
      member.userId === "u-samarth" &&
      member.conversationId === "conv-channel-product"
    ) {
      lastReadAt = list[3] ?? list[0];
    } else if (
      member.userId === "u-samarth" &&
      member.conversationId === "conv-dm-samarth-maya"
    ) {
      lastReadAt = list[1] ?? list[0];
    } else if (
      preExistingIds.has(member.userId) &&
      member.conversationId.startsWith("conv-channel-")
    ) {
      lastReadAt = list[1] ?? list[0];
    } else {
      lastReadAt = list[0];
    }
    await db
      .update(conversationMember)
      .set({ lastReadAt })
      .where(
        and(
          eq(conversationMember.conversationId, member.conversationId),
          eq(conversationMember.userId, member.userId),
        ),
      );
    summary.lastReadUpdated += 1;
  }

  for (const conv of conversations) {
    const list = newestTimes[conv.id];
    const updatedAt = list && list.length > 0 ? list[0] : conv.createdAt;
    await db
      .update(conversation)
      .set({ updatedAt })
      .where(eq(conversation.id, conv.id));
  }

  console.log("Seed summary:");
  console.log(
    `  users: ${summary.usersCreated} created, ${summary.usersSkipped} skipped`,
  );
  console.log(
    `  channels: ${summary.channelsCreated} created, ${summary.channelsSkipped} skipped`,
  );
  console.log(
    `  dms: ${summary.dmsCreated} created, ${summary.dmsSkipped} skipped`,
  );
  console.log(
    `  members: ${summary.membersAdded} added, ${summary.membersSkipped} skipped`,
  );
  console.log(
    `  messages: ${summary.messagesSeeded} seeded across ${summary.conversationsSeeded} conversations (${summary.conversationsSkipped} skipped, already had messages)`,
  );
  console.log(`  reactions: ${summary.reactionsAdded} added`);
  console.log(`  lastReadAt: ${summary.lastReadUpdated} members updated`);
  console.log(
    `  projects: ${summary.projectsCreated} created, ${summary.projectsSkipped} skipped`,
  );
  console.log(
    `  tasks: ${summary.tasksCreated} created, ${summary.tasksSkipped} skipped`,
  );
  console.log(
    `  meetings: ${summary.meetingsCreated} created, ${summary.meetingsSkipped} skipped`,
  );
  console.log(
    `  meeting members: ${summary.meetingMembersAdded} added, ${summary.meetingMembersSkipped} skipped`,
  );
  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

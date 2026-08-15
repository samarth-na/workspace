import { and, asc, desc, eq, gte, lt, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { file } from "@/db/files";
import { meeting, meetingMember } from "@/db/meetings";
import { user } from "@/db/schema";
import { project, task } from "@/db/tasks";
import type { FileItem } from "@/lib/file-types";
import { toFileItem } from "@/lib/files-data";
import { toMeetingSummary } from "@/lib/meeting-data";
import type { MeetingSummary } from "@/lib/meeting-types";
import type { TaskStatus } from "@/lib/task-types";

export type HomeTaskItem = {
  id: string;
  title: string;
  status: TaskStatus;
  projectName: string | null;
  projectColor: string | null;
  dueDate: number | null;
};

export type HomeData = {
  tasks: HomeTaskItem[];
  meetings: MeetingSummary[];
  files: FileItem[];
};

export async function fetchHomeData(
  userId: string,
  workspaceId: string,
): Promise<HomeData> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [taskRows, meetingRows, fileRows] = await Promise.all([
    db
      .select({
        id: task.id,
        title: task.title,
        status: task.status,
        projectName: project.name,
        projectColor: project.color,
        dueDate: task.dueDate,
      })
      .from(task)
      .leftJoin(project, eq(project.id, task.projectId))
      .where(
        and(
          eq(task.workspaceId, workspaceId),
          eq(task.assigneeId, userId),
          ne(task.status, "done"),
        ),
      )
      .orderBy(sql`${task.dueDate} asc nulls last`, asc(task.createdAt))
      .limit(5),
    db
      .select({ row: meeting })
      .from(meeting)
      .innerJoin(
        meetingMember,
        and(
          eq(meetingMember.meetingId, meeting.id),
          eq(meetingMember.userId, userId),
        ),
      )
      .where(
        and(
          eq(meeting.workspaceId, workspaceId),
          ne(meeting.status, "ended"),
          gte(meeting.startsAt, startOfDay),
          lt(meeting.startsAt, startOfTomorrow),
        ),
      )
      .orderBy(asc(meeting.startsAt))
      .limit(4),
    db
      .select({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        storedName: file.storedName,
        uploaderName: user.name,
        createdAt: file.createdAt,
      })
      .from(file)
      .innerJoin(user, eq(user.id, file.uploaderId))
      .where(eq(file.workspaceId, workspaceId))
      .orderBy(desc(file.createdAt))
      .limit(5),
  ]);

  const meetings = await Promise.all(
    meetingRows.map((row) => toMeetingSummary(row.row, userId)),
  );

  return {
    tasks: taskRows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      projectName: row.projectName,
      projectColor: row.projectColor,
      dueDate: row.dueDate ? row.dueDate.getTime() : null,
    })),
    meetings,
    files: fileRows.map(toFileItem),
  };
}

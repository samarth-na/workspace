import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MeetingRoom } from "@/components/meetings/meeting-room";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Meeting | Cloud Workspace",
};

function RoomFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[#11131a]">
      <span className="size-2 animate-pulse rounded-full bg-[#9cb8f7]" />
    </div>
  );
}

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return (
    <Suspense fallback={<RoomFallback />}>
      <MeetingLoader params={params} />
    </Suspense>
  );
}

async function MeetingLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MeetingRoom meetingId={id} />;
}

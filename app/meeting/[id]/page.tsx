import type { Metadata } from "next";
import { Suspense } from "react";
import { MeetingRoom } from "@/components/meetings/meeting-room";

export const metadata: Metadata = {
  title: "Meeting | Cloud Workspace",
};

function RoomFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[#11131a]">
      <span className="size-2 animate-pulse rounded-full bg-[#aeb7ff]" />
    </div>
  );
}

export default function MeetingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

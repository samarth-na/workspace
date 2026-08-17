import type { Metadata } from "next";
import { Suspense } from "react";
import { CallRoom } from "@/components/calls/call-room";

export const metadata: Metadata = {
  title: "Call | Cloud Workspace",
};

function RoomFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[#11131a]">
      <span className="size-2 animate-pulse rounded-full bg-[#9cb8f7]" />
    </div>
  );
}

export default function CallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<RoomFallback />}>
      <CallLoader params={params} />
    </Suspense>
  );
}

async function CallLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CallRoom callId={id} />;
}

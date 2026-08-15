import { Suspense } from "react";
import { Thread } from "@/components/chat/thread";

function ThreadFallback() {
  return (
    <div className="flex h-full min-h-0 animate-pulse flex-col overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white" />
  );
}

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<ThreadFallback />}>
      <Thread key={id} conversationId={id} />
    </Suspense>
  );
}

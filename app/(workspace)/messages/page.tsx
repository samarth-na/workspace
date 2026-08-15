import { MessageCircle } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="hidden h-full min-h-0 items-center justify-center rounded-2xl border border-[#e5e7ec] bg-white p-8 text-center lg:flex">
      <div>
        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-[#f1f2f6] text-[#7f89a0]">
          <MessageCircle className="size-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-[14px] font-semibold text-[#30394c]">
          No conversation selected
        </h2>
        <p className="mt-1 text-[12px] text-[#9299a8]">
          Pick a conversation from the list or start a new one.
        </p>
      </div>
    </div>
  );
}

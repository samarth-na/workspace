"use client";

import { ViewFrame } from "@/components/shared/view-frame";
import { useShell } from "@/components/shell/shell-context";
import { cn } from "@/lib/utils";

const people = [
  {
    name: "Maya Chen",
    role: "Product design",
    initials: "MC",
    color: "bg-[#f5c7b8]",
  },
  {
    name: "Jordan Lee",
    role: "Engineering",
    initials: "JL",
    color: "bg-[#c6d8f5]",
  },
  {
    name: "Priya Shah",
    role: "Product marketing",
    initials: "PS",
    color: "bg-[#ddd0f3]",
  },
  {
    name: "Alex Morgan",
    role: "Research",
    initials: "AM",
    color: "bg-[#d4e8cf]",
  },
];

function PeopleView() {
  const { notify, navigate } = useShell();
  return (
    <ViewFrame
      title="People"
      description="Everyone who makes Cedar & Co. work."
      action="Invite people"
      onAction={() => notify("Invite link copied")}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {people.map((person) => (
          <div
            className="rounded-2xl border border-[#e5e7ec] bg-white p-5 shadow-[0_2px_7px_rgba(32,41,60,0.025)]"
            key={person.name}
          >
            <span
              className={cn(
                "flex size-11 items-center justify-center rounded-full text-[12px] font-semibold text-[#514e9a]",
                person.color,
              )}
            >
              {person.initials}
            </span>
            <h3 className="mt-4 text-[14px] font-semibold text-[#30394c]">
              {person.name}
            </h3>
            <p className="mt-1 text-[12px] text-[#9299a8]">{person.role}</p>
            <button
              type="button"
              className="mt-5 text-[12px] font-semibold text-[#6972cd] hover:text-[#4b55bd]"
              onClick={() => {
                navigate("/messages");
                notify(`Opening a message with ${person.name}`);
              }}
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </ViewFrame>
  );
}

export { PeopleView };

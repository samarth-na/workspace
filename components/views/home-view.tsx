"use client";

import {
  ArrowUpRight,
  ChevronDown,
  FileText,
  Image,
  MessageCircle,
  Plus,
  Search,
  Settings2,
  Table2,
  Video,
} from "lucide-react";
import { useShell } from "@/components/shell/shell-context";
import { Button } from "@/components/ui/button";

type FileTone = "indigo" | "orange" | "green" | "rose";
type FileItem = {
  name: string;
  type: string;
  size: string;
  updated: string;
  icon: typeof FileText;
  tone: FileTone;
};

// biome-ignore lint/correctness/noUnusedVariables: duplicate demo data required by spec
const files: FileItem[] = [
  {
    name: "Q3 product brief",
    type: "Document",
    size: "2.4 MB",
    updated: "Updated 18 min ago",
    icon: FileText,
    tone: "indigo",
  },
  {
    name: "Launch moodboard",
    type: "Images",
    size: "18 items",
    updated: "Updated yesterday",
    icon: Image,
    tone: "orange",
  },
  {
    name: "Sprint planning",
    type: "Spreadsheet",
    size: "840 KB",
    updated: "Updated Aug 14",
    icon: Table2,
    tone: "green",
  },
  {
    name: "Team offsite 2026",
    type: "Presentation",
    size: "12 slides",
    updated: "Updated Aug 12",
    icon: FileText,
    tone: "rose",
  },
];

export function HomeView() {
  const { userName, notify, navigate, openSearch, openCreate } = useShell();
  const firstName = userName.split(" ")[0];

  return (
    <section className="overflow-hidden rounded-xl border border-[var(--bg-border-color)] bg-[var(--color-bg-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between border-b border-[#ededee] px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-medium text-[#99999c]">
            Workspace · {firstName}
          </p>
          <h1 className="mt-1 text-[18px] font-semibold tracking-[-0.025em] text-[#29292c]">
            Home
          </h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Search workspace"
            className="flex size-8 items-center justify-center rounded-lg text-[#89898c] hover:bg-[#f0f0f1] hover:text-[#454548]"
            onClick={openSearch}
          >
            <Search className="size-[17px]" strokeWidth={1.8} />
          </button>
          <button
            type="button"
            aria-label="Workspace filters"
            className="flex size-8 items-center justify-center rounded-lg text-[#89898c] hover:bg-[#f0f0f1] hover:text-[#454548]"
            onClick={() => notify("Workspace filters opened")}
          >
            <Settings2 className="size-[17px]" strokeWidth={1.8} />
          </button>
          <Button
            className="ml-1 hidden h-8 rounded-lg bg-[#2e2e31] px-3 text-[12px] font-medium text-white hover:bg-[#444448] sm:flex"
            onClick={openCreate}
          >
            <Plus className="size-3.5" /> New
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ededee] px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 items-center gap-2 rounded-full border border-[#dedee0] bg-[#f7f7f8] px-3 text-[12px] font-medium text-[#3d3d40]"
            onClick={() => notify("Showing all workspace items")}
          >
            All workspace <ChevronDown className="size-3.5 text-[#88888c]" />
          </button>
          <span className="hidden text-[12px] text-[#a2a2a5] sm:inline">
            24 items
          </span>
        </div>
      </div>

      <div className="border-b border-[#ededee] px-5 py-5 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#5db886]" />
            <h2 className="text-[12px] font-semibold text-[#4b4b4e]">
              Happening now
            </h2>
          </div>
          <span className="text-[11px] text-[#a0a0a3]">
            Saturday, August 15
          </span>
        </div>
        <div className="flex flex-col gap-4 rounded-lg border border-[#e6e6e7] bg-[#fbfbfc] px-4 py-3.5 sm:flex-row sm:items-center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e4f3e9] text-[#56a878]">
            <Video className="size-[17px]" strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-[#363639]">
              Weekly product sync
            </p>
            <p className="mt-1 text-[11px] text-[#8f8f93]">
              Maya is sharing the latest launch notes · 6 participants
            </p>
          </div>
          <span className="text-[11px] text-[#8f8f93]">Started 18 min ago</span>
          <Button
            className="h-8 rounded-lg bg-[#f0f0f1] px-3 text-[12px] font-medium text-[#3e3e41] hover:bg-[#e5e5e6]"
            onClick={() => {
              navigate("/calls");
              notify("Joining Weekly product sync");
            }}
          >
            Join
          </Button>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[12px] font-semibold text-[#4b4b4e]">Recent</h2>
          <button
            type="button"
            className="text-[11px] text-[#8d8d91] hover:text-[#47474a]"
            onClick={() => navigate("/files")}
          >
            View all
          </button>
        </div>
        <div className="hidden grid-cols-[minmax(250px,1.6fr)_0.8fr_0.8fr_32px] gap-4 border-b border-[#eeeeef] px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.06em] text-[#a1a1a4] sm:grid">
          <span>Name</span>
          <span>Type</span>
          <span>Updated</span>
          <span />
        </div>
        <div className="divide-y divide-[#eeeeef]">
          <WorkspaceRow
            icon={FileText}
            name="Q3 product brief"
            description="Launch planning and product updates"
            type="Document"
            updated="18 min ago"
            onClick={() => {
              navigate("/files");
              notify("Opening Q3 product brief");
            }}
          />
          <WorkspaceRow
            icon={Image}
            name="Launch moodboard"
            description="18 images · Shared with product"
            type="Images"
            updated="Yesterday"
            onClick={() => {
              navigate("/files");
              notify("Opening Launch moodboard");
            }}
          />
          <WorkspaceRow
            icon={MessageCircle}
            name="# product"
            description="3 unread messages · Maya, Jordan, Priya"
            type="Channel"
            updated="Yesterday"
            onClick={() => {
              navigate("/messages");
              notify("Opening # product");
            }}
          />
          <WorkspaceRow
            icon={Table2}
            name="Sprint planning"
            description="Planning notes and assigned work"
            type="Spreadsheet"
            updated="Aug 14"
            onClick={() => {
              navigate("/files");
              notify("Opening Sprint planning");
            }}
          />
        </div>
      </div>

      <div className="border-t border-[#ededee] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[12px] font-semibold text-[#4b4b4e]">
              Upcoming
            </h2>
            <p className="mt-1 text-[11px] text-[#9a9a9d]">
              The next moments on your calendar.
            </p>
          </div>
          <button
            type="button"
            className="text-[11px] text-[#8d8d91] hover:text-[#47474a]"
            onClick={() => navigate("/calls")}
          >
            Open calendar
          </button>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <UpcomingRow
            time="1:00 PM"
            title="Design critique"
            detail="Product design · 45 min"
            onClick={() => navigate("/calls")}
          />
          <UpcomingRow
            time="3:30 PM"
            title="Customer research"
            detail="Research · 30 min"
            onClick={() => navigate("/calls")}
          />
          <UpcomingRow
            time="Tomorrow"
            title="All-hands meeting"
            detail="Everyone · 9:00 AM"
            onClick={() => navigate("/calls")}
          />
        </div>
      </div>
    </section>
  );
}

function WorkspaceRow({
  icon: Icon,
  name,
  description,
  type,
  updated,
  onClick,
}: {
  icon: typeof FileText;
  name: string;
  description: string;
  type: string;
  updated: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="grid w-full grid-cols-1 gap-2 px-3 py-3 text-left transition-colors hover:bg-[#fafafa] sm:grid-cols-[minmax(250px,1.6fr)_0.8fr_0.8fr_32px] sm:items-center sm:gap-4"
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f0f0f1] text-[#858589]">
          <Icon className="size-4" strokeWidth={1.7} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-[#3d3d40]">
            {name}
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-[#98989b] sm:hidden">
            {description}
          </span>
        </span>
      </span>
      <span className="hidden text-[12px] text-[#77777b] sm:block">{type}</span>
      <span className="hidden text-[12px] text-[#8f8f93] sm:block">
        {updated}
      </span>
      <ArrowUpRight className="hidden size-4 justify-self-end text-[#b0b0b3] sm:block" />
    </button>
  );
}

function UpcomingRow({
  time,
  title,
  detail,
  onClick,
}: {
  time: string;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-lg border border-[#e8e8e9] bg-[#fbfbfc] px-3 py-3 text-left transition-colors hover:border-[#d8d8db] hover:bg-[#f6f6f7]"
      onClick={onClick}
    >
      <p className="text-[10px] font-medium text-[#9a9a9d]">{time}</p>
      <p className="mt-1 text-[12px] font-medium text-[#4d4d50]">{title}</p>
      <p className="mt-1 text-[10px] text-[#9a9a9d]">{detail}</p>
    </button>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  Bulletlist,
  Calendar,
  ChartBarBig,
  Check,
  CheckDouble,
  Folder,
  Grid2x3,
  Inbox,
  ListBox,
  MessageText,
  Mic,
  Monitor,
  Search,
  Users,
  Video,
} from "pixelarticons/react";
import type * as React from "react";

const AVATAR_BG = {
  blue: "#9cb8f7",
  amber: "#f2c9a0",
  green: "#b8e0c9",
  rose: "#e5a1a5",
} as const;

function Avatar({
  name,
  color,
  className = "size-7 text-[11px]",
}: {
  name: string;
  color: keyof typeof AVATAR_BG;
  className?: string;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-[#4a5578] ${className}`}
      style={{ backgroundColor: AVATAR_BG[color] }}
    >
      {name.charAt(0)}
    </span>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-[9px] bg-[#9cb8f7] font-bold text-[#31518e] ${
          compact ? "size-7 text-[12px]" : "size-9 text-[14px]"
        }`}
      >
        C
      </span>
      <span
        className={`font-semibold tracking-[-0.01em] text-[#232b42] ${
          compact ? "text-[13px]" : "text-[15px]"
        }`}
      >
        Cedar &amp; Co.
      </span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium tracking-[0.16em] text-[#8b93a6] uppercase">
      {children}
    </p>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-3 text-[30px] leading-[1.15] font-semibold tracking-[-0.025em] text-[#232b42] sm:text-[38px]">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 text-[16px] leading-relaxed text-[#677085]">
          {body}
        </p>
      ) : null}
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 flex flex-col gap-3.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e8f7ee] text-[#2f7d4f]">
            <Check className="size-3" />
          </span>
          <span className="text-[15px] leading-relaxed text-[#3f4859]">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PrimaryLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#232b42] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#2f3957] ${className}`}
    >
      {children}
      <ArrowRight className="size-4" />
    </Link>
  );
}

function GhostLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-lg border border-[#e3e5ea] bg-white px-6 text-[14px] font-medium text-[#3f4859] shadow-[0_1px_2px_rgba(35,43,66,0.04)] transition-colors hover:border-[#d6dae2] hover:bg-[#f7f8fa]"
    >
      {children}
    </Link>
  );
}

function Nav() {
  const links = [
    { href: "#product", label: "Product" },
    { href: "#tasks", label: "Tasks" },
    { href: "#messaging", label: "Messaging" },
    { href: "#calls", label: "Calls" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-[#e9ebef] bg-[#fafbfc]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" aria-label="Cedar & Co. home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13.5px] font-medium text-[#596275] transition-colors hover:text-[#232b42]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-[#596275] transition-colors hover:bg-[#f0f1f4] hover:text-[#232b42]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#232b42] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2f3957]"
          >
            Get started
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function MockMessage({
  name,
  time,
  body,
  color,
  reaction,
}: {
  name: string;
  time: string;
  body: string;
  color: keyof typeof AVATAR_BG;
  reaction?: string;
}) {
  return (
    <div className="flex gap-3">
      <Avatar name={name} color={color} />
      <div className="min-w-0">
        <p className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-[#232b42]">
            {name}
          </span>
          <span className="font-mono text-[10px] text-[#aab2c5]">{time}</span>
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-[#596275]">
          {body}
        </p>
        {reaction ? (
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[#e3e5ea] bg-[#fafbfd] px-2 py-0.5 text-[11px] text-[#596275]">
            👍 {reaction}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function HeroMockup() {
  const navItems = [
    { icon: Inbox, label: "Inbox", badge: "3" },
    { icon: MessageText, label: "Messages", active: true },
    { icon: Bulletlist, label: "Tasks" },
    { icon: Folder, label: "Files" },
    { icon: Video, label: "Calls" },
    { icon: Users, label: "People" },
  ];

  return (
    <div id="product" className="relative mt-16 scroll-mt-24 sm:mt-20">
      <div className="pointer-events-none absolute -inset-x-10 -top-12 bottom-8 rounded-[36px] bg-[radial-gradient(ellipse_at_top,#e3eaf8,transparent_70%)]" />
      <div className="relative overflow-hidden rounded-2xl border border-[#e3e5ea] bg-white shadow-[0_24px_60px_-16px_rgba(35,43,66,0.16),0_4px_12px_rgba(35,43,66,0.05)]">
        <div className="flex items-center gap-2 border-b border-[#eef0f4] bg-[#fdfdfe] px-4 py-3">
          <span className="size-2.5 rounded-full bg-[#e5a1a5]" />
          <span className="size-2.5 rounded-full bg-[#ecd9a0]" />
          <span className="size-2.5 rounded-full bg-[#a8d5b1]" />
          <span className="ml-3 truncate rounded-md border border-[#e3e5ea] bg-white px-3 py-1 font-mono text-[11px] text-[#8991a3]">
            cedar.co/messages/product-launch
          </span>
        </div>
        <div className="grid grid-cols-[190px_1fr] text-left">
          <div className="hidden flex-col gap-1 border-r border-[#eef0f4] bg-[#fafbfd] p-3 sm:flex">
            <div className="flex items-center gap-2 px-2 pt-1 pb-3">
              <span className="flex size-5 items-center justify-center rounded-md bg-[#9cb8f7] text-[10px] font-bold text-[#31518e]">
                C
              </span>
              <span className="truncate text-[12px] font-semibold text-[#232b42]">
                Cedar &amp; Co.
              </span>
            </div>
            {navItems.map((item) => (
              <span
                key={item.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] ${
                  item.active
                    ? "bg-white font-medium text-[#232b42] shadow-[0_1px_2px_rgba(35,43,66,0.06)]"
                    : "text-[#8991a3]"
                }`}
              >
                <item.icon className="size-3.5" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-[#9cb8f7] px-1.5 text-[10px] font-semibold text-[#31518e]">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            ))}
            <div className="mt-4 px-2 font-mono text-[10px] tracking-[0.12em] text-[#aab2c5] uppercase">
              Channels
            </div>
            {["# product-launch", "# design", "# general"].map((channel) => (
              <span
                key={channel}
                className={`truncate rounded-md px-2 py-1.5 font-mono text-[12px] ${
                  channel === "# product-launch"
                    ? "bg-[#eef3fd] font-medium text-[#31518e]"
                    : "text-[#8991a3]"
                }`}
              >
                {channel}
              </span>
            ))}
            <div className="mt-4 px-2 font-mono text-[10px] tracking-[0.12em] text-[#aab2c5] uppercase">
              Projects
            </div>
            {[
              { name: "Q3 Launch", color: AVATAR_BG.blue },
              { name: "Website", color: AVATAR_BG.green },
            ].map((project) => (
              <span
                key={project.name}
                className="flex items-center gap-2 truncate px-2 py-1.5 text-[12px] text-[#8991a3]"
              >
                <span
                  className="size-2 rounded-[3px]"
                  style={{ backgroundColor: project.color }}
                />
                <span className="truncate">{project.name}</span>
              </span>
            ))}
          </div>
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between border-b border-[#eef0f4] px-5 py-3">
              <span className="font-mono text-[13px] font-medium text-[#232b42]">
                # product-launch
              </span>
              <span className="flex items-center gap-1.5 rounded-md border border-[#e3e5ea] px-2 py-1 text-[11px] text-[#8991a3]">
                <span className="size-1.5 rounded-full bg-[#5cae7c]" />4 online
              </span>
            </div>
            <div className="flex flex-col gap-4 px-5 py-5">
              <MockMessage
                name="Maya Chen"
                color="blue"
                time="9:41 AM"
                body="Morning team — Q3 brief v4 is in Files. Feedback by EOD please!"
              />
              <MockMessage
                name="Priya Shah"
                color="amber"
                time="9:43 AM"
                body="The positioning section reads great. Left two comments on pricing."
                reaction="2"
              />
              <MockMessage
                name="Jordan Lee"
                color="green"
                time="9:45 AM"
                body="Nice work. Walking through it on the design standup — call is live now."
              />
              <div className="flex items-center gap-2 pl-10 font-mono text-[11px] text-[#aab2c5]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#5cae7c]" />
                Samarth is typing…
              </div>
            </div>
            <div className="mt-auto border-t border-[#eef0f4] px-5 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#e3e5ea] bg-[#fafbfd] px-3 py-2 text-[12px] text-[#aab2c5]">
                Message # product-launch
                <span className="ml-auto rounded border border-[#e3e5ea] bg-white px-1.5 font-mono text-[10px] text-[#8991a3]">
                  Return
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-24 -right-4 hidden w-60 rounded-xl border border-[#e3e5ea] bg-white p-3.5 shadow-[0_16px_40px_-12px_rgba(35,43,66,0.2)] lg:block xl:-right-10">
        <div className="flex items-start gap-2.5">
          <span className="mt-1 flex size-7 items-center justify-center rounded-lg bg-[#eef3fd] text-[#31518e]">
            <Bulletlist className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-[#232b42]">
              Review Q3 brief v4
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8991a3]">
              <span className="size-1.5 rounded-full bg-[#e5a1a5]" />
              Urgent · Due today
            </p>
          </div>
          <Avatar name="S" color="green" className="size-5 text-[9px]" />
        </div>
        <div className="mt-2.5 flex items-center gap-1 border-t border-[#eef0f4] pt-2.5 font-mono text-[10px] text-[#aab2c5]">
          IN REVIEW
          <span className="ml-auto text-[#9aa1ad]">2d</span>
        </div>
      </div>

      <div className="absolute -bottom-8 -right-4 hidden w-56 rounded-xl border border-[#e3e5ea] bg-white p-3.5 shadow-[0_16px_40px_-12px_rgba(35,43,66,0.22)] sm:block md:-right-10">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#e8f7ee] text-[#2f7d4f]">
            <Video className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-[#232b42]">
              Design standup
            </p>
            <p className="text-[11px] text-[#8991a3]">Live · 4 members</p>
          </div>
        </div>
        <div className="mt-3 flex -space-x-1.5">
          {(["blue", "amber", "green", "rose"] as const).map((color, index) => (
            <Avatar
              key={color}
              name={["M", "P", "S", "A"][index]}
              color={color}
              className="size-5 border-2 border-white text-[9px]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[#eef1f8] to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-5 text-center sm:px-8">
        <Link
          href="#tasks"
          className="inline-flex items-center gap-2 rounded-full border border-[#e3e5ea] bg-white/80 py-1 pr-3 pl-1 text-[12px] font-medium text-[#596275] shadow-[0_1px_2px_rgba(35,43,66,0.04)] transition-colors hover:border-[#c9d4ef]"
        >
          <span className="rounded-full bg-[#eef3fd] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#31518e]">
            NEW
          </span>
          Tasks with board, calendar, and timeline views
          <ArrowRight className="size-3.5 text-[#8991a3]" />
        </Link>
        <h1 className="mx-auto mt-6 max-w-3xl text-[40px] leading-[1.06] font-semibold tracking-[-0.03em] text-[#232b42] sm:text-[58px]">
          Every message, task, file, and call. One calm workspace.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-[#677085] sm:text-[18px]">
          Cedar &amp; Co. replaces the tab-hopping. Chat in real time, plan work
          your way, share files, and jump on a call — together in one shared
          place.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PrimaryLink href="/sign-up" className="w-full sm:w-auto">
            Get started free
          </PrimaryLink>
          <GhostLink href="/sign-in">Sign in</GhostLink>
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-[0.08em] text-[#9aa1ad] uppercase">
          Free for your whole team · Sign up with email, GitHub, or Google
        </p>
        <HeroMockup />
      </div>
    </section>
  );
}

const CAPABILITIES = [
  { icon: MessageText, label: "Real-time messaging" },
  { icon: ChartBarBig, label: "Five task views" },
  { icon: Video, label: "Live team calls" },
  { icon: Users, label: "One shared directory" },
] as const;

function CapabilityStrip() {
  return (
    <section className="border-y border-[#e9ebef] bg-white">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px px-5 sm:px-8 md:grid-cols-4">
        {CAPABILITIES.map((capability) => (
          <div
            key={capability.label}
            className="flex items-center justify-center gap-2.5 py-5"
          >
            <capability.icon className="size-4 text-[#31518e]" />
            <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-[#596275] uppercase">
              {capability.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

const FEATURES: {
  icon: typeof MessageText;
  title: string;
  body: string;
  chips?: string[];
  wide?: boolean;
}[] = [
  {
    icon: MessageText,
    title: "Messages",
    body: "Channels and direct messages that update in real time. Reactions, read state, and unread counts stay in sync for everyone.",
    chips: ["Channels", "DMs", "Reactions", "Unreads"],
    wide: true,
  },
  {
    icon: Bulletlist,
    title: "Tasks",
    body: "Plan work your way — five views, from board to timeline.",
  },
  {
    icon: Folder,
    title: "Files",
    body: "Folders, uploads, and instant previews in one shared home.",
  },
  {
    icon: Video,
    title: "Calls",
    body: "Start a call from the sidebar or any conversation. Join in one click.",
  },
  {
    icon: Users,
    title: "People",
    body: "One directory for your whole team — names, photos, and roles.",
  },
  {
    icon: Inbox,
    title: "Inbox",
    body: "Mentions, assignments, and reminders, queued in one place.",
  },
  {
    icon: Search,
    title: "Search",
    body: "Find any conversation, file, or teammate in seconds.",
  },
];

function Features() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-b border-[#e9ebef] py-20 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Features"
          title="Six tools your team already uses, in one place."
          body="Each part of Cedar & Co. does one job well, and they all speak to each other. A task links to a file, a call starts from a conversation."
        />
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`group rounded-2xl border border-[#e6e8ec] bg-white p-6 shadow-[0_1px_2px_rgba(35,43,66,0.03)] transition-all hover:-translate-y-0.5 hover:border-[#c9d4ef] hover:shadow-[0_12px_32px_-12px_rgba(35,43,66,0.15)] ${
                feature.wide ? "sm:col-span-2" : ""
              }`}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-[#eef3fd] text-[#31518e]">
                <feature.icon className="size-[17px]" />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-[#232b42]">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#7a8294]">
                {feature.body}
              </p>
              {feature.chips ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {feature.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-[#e6e8ec] bg-[#fafbfd] px-2.5 py-1 font-mono text-[10px] font-medium tracking-wide text-[#8b93a6] uppercase"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TASK_VIEW_TABS = [
  { icon: ListBox, label: "List" },
  { icon: Grid2x3, label: "Board" },
  { icon: CheckDouble, label: "Todo" },
  { icon: Calendar, label: "Calendar" },
  { icon: ChartBarBig, label: "Timeline" },
] as const;

const KANBAN_COLUMNS = [
  {
    label: "To do",
    count: 2,
    cards: [
      {
        title: "Update pricing page copy",
        priority: "Urgent",
        priorityColor: "#e5a1a5",
        due: "Today",
        assignee: "M",
        assigneeColor: "blue" as const,
      },
      {
        title: "Draft launch announcement",
        priority: "Medium",
        priorityColor: "#9cb8f7",
        due: "Thu",
        assignee: "A",
        assigneeColor: "rose" as const,
      },
    ],
  },
  {
    label: "In progress",
    count: 1,
    cards: [
      {
        title: "Ship new empty states",
        priority: "High",
        priorityColor: "#ecd9a0",
        due: "Tomorrow",
        assignee: "J",
        assigneeColor: "green" as const,
      },
    ],
  },
  {
    label: "In review",
    count: 1,
    cards: [
      {
        title: "Q3 product brief v4",
        priority: "Urgent",
        priorityColor: "#e5a1a5",
        due: "Today",
        assignee: "P",
        assigneeColor: "amber" as const,
      },
    ],
  },
];

function TasksSection() {
  return (
    <section
      id="tasks"
      className="scroll-mt-20 border-b border-[#e9ebef] bg-[#f7f8fb] py-20 sm:py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Tasks"
            title="Plan work in the view that fits."
            body="Every task carries a status, a priority, an assignee, and a due date. Switch views whenever the plan changes shape."
          />
          <CheckList
            items={[
              "Five views — list, board, todo, calendar, and timeline.",
              "Drag and drop tasks between statuses.",
              "Set priority, start date, due date, and reminders.",
              "Attach files and mention teammates right on a task.",
            ]}
          />
        </div>
        <div>
          <div className="rounded-2xl border border-[#e3e5ea] bg-white p-4 shadow-[0_16px_44px_-16px_rgba(35,43,66,0.12)]">
            <div className="flex items-center gap-1 rounded-lg border border-[#e6e8ec] bg-[#fafbfd] p-1">
              {TASK_VIEW_TABS.map((tab) => (
                <span
                  key={tab.label}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium ${
                    tab.label === "Board"
                      ? "bg-white text-[#232b42] shadow-[0_1px_2px_rgba(35,43,66,0.06)]"
                      : "text-[#9aa1ad]"
                  }`}
                >
                  <tab.icon className="size-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {KANBAN_COLUMNS.map((column) => (
                <div key={column.label} className="min-w-0">
                  <p className="flex items-center gap-2 px-1 pb-2.5 font-mono text-[10px] font-medium tracking-[0.1em] text-[#9aa1ad] uppercase">
                    {column.label}
                    <span className="rounded-full bg-[#f0f1f4] px-1.5 text-[9px] text-[#8b93a6]">
                      {column.count}
                    </span>
                  </p>
                  <div className="flex flex-col gap-2">
                    {column.cards.map((card) => (
                      <div
                        key={card.title}
                        className="rounded-lg border border-[#e6e8ec] bg-white p-2.5 shadow-[0_1px_2px_rgba(35,43,66,0.04)]"
                      >
                        <p className="text-[12px] leading-snug font-medium text-[#3f4859]">
                          {card.title}
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="flex items-center gap-1 rounded-full bg-[#fafbfd] px-1.5 py-0.5 text-[9.5px] font-medium text-[#8b93a6]">
                            <span
                              className="size-1.5 rounded-full"
                              style={{ backgroundColor: card.priorityColor }}
                            />
                            {card.priority}
                          </span>
                          <span className="ml-auto font-mono text-[9.5px] text-[#aab2c5]">
                            {card.due}
                          </span>
                          <Avatar
                            name={card.assignee}
                            color={card.assigneeColor}
                            className="size-5 text-[9px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-center font-mono text-[10px] tracking-[0.1em] text-[#aab2c5] uppercase">
            Backlog → To do → In progress → In review → Done
          </p>
        </div>
      </div>
    </section>
  );
}

function MessagingSection() {
  return (
    <section
      id="messaging"
      className="scroll-mt-20 border-b border-[#e9ebef] py-20 sm:py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-[#e3e5ea] bg-white p-6 shadow-[0_16px_44px_-16px_rgba(35,43,66,0.14)]">
            <div className="flex items-center justify-between border-b border-[#eef0f4] pb-3">
              <span className="font-mono text-[13px] font-medium text-[#232b42]">
                # design
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-[#e8f7ee] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#2f7d4f]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#5cae7c]" />
                LIVE
              </span>
            </div>
            <div className="flex flex-col gap-4 pt-4">
              <MockMessage
                name="Jordan Lee"
                color="green"
                time="11:02 AM"
                body="Pushed the updated empty states — much cleaner."
              />
              <MockMessage
                name="Alex Morgan"
                color="rose"
                time="11:04 AM"
                body="Love it. Adding notes in the brief now, then let's talk on the call."
                reaction="4"
              />
              <div className="flex items-center gap-2 pl-10 font-mono text-[11px] text-[#aab2c5]">
                <span className="size-1.5 animate-pulse rounded-full bg-[#5cae7c]" />
                Maya is typing…
              </div>
            </div>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Messaging"
            title="Conversations that keep up with you."
            body="Channels and direct messages run over a live connection. No refresh, no waiting."
          />
          <CheckList
            items={[
              "Messages land instantly for everyone in the room.",
              "Reactions and read state stay in sync.",
              "Unread counts follow you across channels and DMs.",
              "Drop offline? Sends fall back safely and catch up when you reconnect.",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function CallsSection() {
  const participants = [
    {
      name: "Maya Chen",
      initials: "M",
      color: "blue" as const,
      speaking: true,
    },
    { name: "Jordan Lee", initials: "J", color: "green" as const },
    { name: "Priya Shah", initials: "P", color: "amber" as const },
    { name: "Samarth", initials: "S", color: "green" as const },
  ];

  return (
    <section
      id="calls"
      className="scroll-mt-20 border-b border-[#e9ebef] bg-[#f7f8fb] py-20 sm:py-28"
    >
      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Calls"
            title="Calls that start where the work is."
            body="Spin up a meeting from the sidebar or schedule it ahead. Live meetings show up right where your team already looks."
          />
          <CheckList
            items={[
              "Join in one click — no links to paste.",
              "Live meetings appear in the sidebar with a live badge.",
              "See who is in the room before you join.",
              "Meetings end, and the room keeps the notes and files.",
            ]}
          />
        </div>
        <div>
          <div className="rounded-2xl border border-[#e3e5ea] bg-white p-5 shadow-[0_16px_44px_-16px_rgba(35,43,66,0.14)]">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold text-[#232b42]">
                Design standup
              </p>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-md bg-[#e8f7ee] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-[#2f7d4f]">
                  <span className="size-1.5 animate-pulse rounded-full bg-[#5cae7c]" />
                  LIVE
                </span>
                <span className="font-mono text-[11px] text-[#aab2c5]">
                  12:04
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {participants.map((participant) => (
                <div
                  key={participant.name}
                  className={`relative flex h-24 flex-col items-center justify-center rounded-xl border bg-[#f4f6fa] sm:h-28 ${
                    participant.speaking
                      ? "border-[#5cae7c] ring-2 ring-[#5cae7c]/30"
                      : "border-[#e6e8ec]"
                  }`}
                >
                  <Avatar
                    name={participant.initials}
                    color={participant.color}
                    className="size-10 text-[15px]"
                  />
                  <p className="mt-2 text-[11px] font-medium text-[#596275]">
                    {participant.name}
                  </p>
                  {participant.speaking ? (
                    <span className="absolute top-2 left-2 font-mono text-[9px] font-semibold tracking-wide text-[#2f7d4f] uppercase">
                      Speaking
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#eef0f4] pt-4">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#f0f1f4] text-[#596275]">
                <Mic className="size-4" />
              </span>
              <span className="flex size-9 items-center justify-center rounded-full bg-[#f0f1f4] text-[#596275]">
                <Video className="size-4" />
              </span>
              <span className="flex size-9 items-center justify-center rounded-full bg-[#f0f1f4] text-[#596275]">
                <Monitor className="size-4" />
              </span>
              <span className="ml-2 flex h-9 items-center rounded-full bg-[#e5a1a5]/20 px-4 text-[12px] font-semibold text-[#b0555c]">
                Leave
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    number: "01",
    title: "Create your workspace",
    body: "Sign up with email, GitHub, or Google. Your workspace is ready in seconds.",
  },
  {
    number: "02",
    title: "Invite your team",
    body: "Add teammates to one shared directory with names, photos, and roles.",
  },
  {
    number: "03",
    title: "Get to work",
    body: "Start chatting, plan in tasks, share files, and jump on calls — all in one place.",
  },
] as const;

function HowItWorks() {
  return (
    <section className="border-b border-[#e9ebef] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Get started"
          title="Up and running in three steps."
        />
        <div className="mt-12 grid gap-3 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl border border-[#e6e8ec] bg-white p-6 pt-8 shadow-[0_1px_2px_rgba(35,43,66,0.03)]"
            >
              <span className="absolute top-5 left-6 font-mono text-[12px] font-semibold tracking-[0.1em] text-[#9cb8f7]">
                {step.number}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold text-[#232b42]">
                {step.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#7a8294]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#dfe3f0] bg-gradient-to-b from-[#eef3fd] to-[#fdfdfe] px-6 py-16 text-center sm:py-20">
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_at_center,#c9d8f7,transparent_65%)] opacity-60" />
          <div className="relative">
            <Logo />
            <h2 className="mx-auto mt-8 max-w-xl text-[30px] leading-[1.15] font-semibold tracking-[-0.025em] text-[#232b42] sm:text-[38px]">
              Bring your team home to one workspace.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#677085]">
              Set up in minutes. Free for your whole team.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryLink href="/sign-up" className="w-full sm:w-auto">
                Create your workspace
              </PrimaryLink>
              <Link
                href="/sign-in"
                className="text-[14px] font-medium text-[#596275] transition-colors hover:text-[#232b42]"
              >
                or sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Messages", href: "#messaging" },
      { label: "Tasks", href: "#tasks" },
      { label: "Calls", href: "#calls" },
      { label: "Files", href: "#features" },
      { label: "Search", href: "#features" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/" },
      { label: "Blog", href: "/" },
      { label: "Careers", href: "/" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Help center", href: "/" },
      { label: "API docs", href: "/" },
      { label: "Status", href: "/" },
    ],
  },
] as const;

function Footer() {
  return (
    <footer className="border-t border-[#e9ebef] bg-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#8b93a6]">
              A calm home for your team&rsquo;s conversations, plans, files, and
              calls.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#aab2c5] uppercase">
                {column.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-[#596275] transition-colors hover:text-[#232b42]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#eef0f4] pt-8 sm:flex-row">
          <p className="text-[12px] text-[#9aa1ad]">
            © {new Date().getFullYear()} Cedar &amp; Co. All rights reserved.
          </p>
          <p className="font-mono text-[10px] tracking-[0.1em] text-[#aab2c5] uppercase">
            Built with Next.js, Drizzle, and Better Auth
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fafbfc]">
      <Nav />
      <main className="flex-1">
        <Hero />
        <CapabilityStrip />
        <Features />
        <TasksSection />
        <MessagingSection />
        <CallsSection />
        <HowItWorks />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

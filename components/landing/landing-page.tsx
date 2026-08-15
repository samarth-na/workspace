import {
  ArrowRight,
  Folder,
  ListTodo,
  MessageCircle,
  Video,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Chat",
    description: "Conversations with threads, reactions, and unread tracking.",
  },
  {
    icon: ListTodo,
    title: "Tasks",
    description: "Assign, prioritize, and track work across projects.",
  },
  {
    icon: Folder,
    title: "Files",
    description: "Upload, organize, and share files with your team.",
  },
  {
    icon: Video,
    title: "Calls",
    description: "Schedule meetings and join live conversations.",
  },
] as const;

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[#fafbfc]">
      <header className="sticky top-0 z-10 border-b border-[#e9ebef] bg-[#fafbfc]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-[9px] bg-[#9cb8f7] text-[13px] font-bold text-[#31518e]">
              C
            </span>
            <span className="text-[14px] font-semibold tracking-[-0.01em] text-[#232b42]">
              Cedar &amp; Co.
            </span>
          </Link>
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
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-5 pb-16 pt-20 text-center sm:px-8 sm:pt-28">
          <span className="inline-flex items-center rounded-full border border-[#e3e5ea] bg-white px-3 py-1 text-[12px] font-medium text-[#596275] shadow-[0_1px_2px_rgba(35,43,66,0.04)]">
            Cedar &amp; Co. workspace
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-[38px] font-semibold leading-[1.1] tracking-[-0.03em] text-[#232b42] sm:text-[52px]">
            Everything your team works on, in one place.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#677085]">
            Messages, tasks, files, and calls. Cedar keeps your team&apos;s work
            together in one shared workspace.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="flex h-11 items-center gap-2 rounded-lg bg-[#232b42] px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#2f3957]"
            >
              Get started
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <Link
              href="/sign-in"
              className="flex h-11 items-center rounded-lg border border-[#e3e5ea] bg-white px-6 text-[14px] font-medium text-[#3f4859] shadow-[0_1px_2px_rgba(35,43,66,0.04)] transition-colors hover:border-[#d6dae2] hover:bg-[#f7f8fa]"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-24 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-[#e6e8ec] bg-white p-5 shadow-[0_1px_2px_rgba(35,43,66,0.03)]"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-[#eef0f3] text-[#5d6677]">
                  <feature.icon className="size-[17px]" strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 text-[14px] font-semibold text-[#232b42]">
                  {feature.title}
                </h2>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#7a8294]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e9ebef]">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-[7px] bg-[#9cb8f7] text-[10px] font-bold text-[#31518e]">
              C
            </span>
            <span className="text-[12px] font-medium text-[#596275]">
              Cedar &amp; Co.
            </span>
          </div>
          <p className="text-[12px] text-[#9aa1ad]">
            A demo workspace built with Next.js, Drizzle, and Better Auth.
          </p>
        </div>
      </footer>
    </div>
  );
}

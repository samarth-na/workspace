"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bulletlist,
  ChartBarBig,
  MessageText,
  Video,
} from "pixelarticons/react";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "#product", label: "Product", icon: ChartBarBig },
  { href: "#tasks", label: "Tasks", icon: Bulletlist },
  { href: "#messaging", label: "Messaging", icon: MessageText },
  { href: "#calls", label: "Calls", icon: Video },
] as const;

function useActiveSection() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = LINKS.map((link) =>
      document.getElementById(link.href.slice(1)),
    ).filter((section): section is HTMLElement => section !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return active;
}

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-[#9cb8f7] text-[13px] font-bold text-[#31518e]">
        C
      </span>
      <span className="hidden text-[14px] font-semibold tracking-[-0.01em] text-[#232b42] sm:inline">
        Cloud Workspace
      </span>
    </span>
  );
}

export function LandingNav() {
  const active = useActiveSection();

  return (
    <header className="sticky top-0 z-40 -mb-[76px] bg-transparent px-4 pt-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 rounded-2xl border border-[#e3e5ea] bg-white/80 px-3 py-2.5 shadow-[0_8px_32px_-12px_rgba(35,43,66,0.18),0_2px_6px_rgba(35,43,66,0.05)] backdrop-blur-xl">
        <Link href="/" aria-label="Cloud Workspace home" className="pl-1">
          <Logo />
        </Link>
        <nav
          aria-label="Landing page sections"
          className="flex items-center gap-0.5 rounded-xl bg-[#f0f1f4] p-1"
        >
          {LINKS.map((link) => {
            const isActive = active === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "true" : undefined}
                title={link.label}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors sm:px-3 ${
                  isActive
                    ? "bg-white text-[#232b42] shadow-[0_1px_3px_rgba(35,43,66,0.1)]"
                    : "text-[#8b93a6] hover:text-[#3f4859]"
                }`}
              >
                <link.icon className="size-3.5" />
                <span className="hidden md:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link
            href="/sign-in"
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#596275] transition-colors hover:bg-[#f0f1f4] hover:text-[#232b42]"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="hidden h-9 items-center gap-1.5 rounded-lg bg-[#232b42] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2f3957] sm:flex"
          >
            Get started
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

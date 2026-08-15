"use client";

import {
  ArrowUpRight,
  Command,
  FileText,
  MessageCircle,
  Search,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const searchResults: {
  icon: typeof FileText;
  title: string;
  detail: string;
  href: string;
}[] = [
  {
    icon: FileText,
    title: "Q3 product brief",
    detail: "Document · Shared files",
    href: "/files",
  },
  {
    icon: MessageCircle,
    title: "# product",
    detail: "Channel · 3 unread messages",
    href: "/messages",
  },
  {
    icon: Users,
    title: "Maya Chen",
    detail: "Person · Product design",
    href: "/people",
  },
  {
    icon: Video,
    title: "Weekly product sync",
    detail: "Call · Live now",
    href: "/calls",
  },
];

export function SearchDialog({
  onClose,
  onAction,
  onNavigate,
}: {
  onClose: () => void;
  onAction: (message: string) => void;
  onNavigate: (href: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? searchResults.filter(
        (result) =>
          result.title.toLowerCase().includes(trimmed) ||
          result.detail.toLowerCase().includes(trimmed),
      )
    : searchResults;

  const openFirst = () => {
    if (results.length === 0) return;
    const first = results[0];
    onNavigate(first.href);
    onAction(`Opening ${first.title}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center bg-[#20293c]/10 px-4 pt-[15vh] backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search workspace"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e3e5ea] bg-white shadow-[0_20px_50px_rgba(35,43,66,0.16)]"
      >
        <div className="flex items-center gap-3 border-b border-[#eff0f3] px-4">
          <Search className="size-4 text-[#9aa1ad]" />
          <input
            ref={inputRef}
            aria-label="Search workspace"
            className="h-14 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[#a1a8b5]"
            placeholder="Search people, files, or messages"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") openFirst();
            }}
          />
          <button
            type="button"
            aria-label="Close search"
            className="rounded-md p-1 text-[#9aa1ad] hover:bg-[#f2f3f6]"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
            {trimmed ? "Results" : "Quick access"}
          </p>
          {results.length > 0 ? (
            results.map((result) => (
              <SearchResult
                key={result.title}
                icon={result.icon}
                title={result.title}
                detail={result.detail}
                onClick={() => {
                  onNavigate(result.href);
                  onAction(`Opening ${result.title}`);
                  onClose();
                }}
              />
            ))
          ) : (
            <p className="px-2 py-6 text-center text-[12px] text-[#9aa1ad]">
              No results for &quot;{query}&quot;
            </p>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-[#eff0f3] px-4 py-3 text-[11px] text-[#9aa1ad]">
          <span>Search everything in Cedar & Co.</span>
          <span className="flex items-center gap-1">
            <Command className="size-3" /> Enter to open
          </span>
        </div>
      </div>
    </div>
  );
}

function SearchResult({
  icon: Icon,
  title,
  detail,
  onClick,
}: {
  icon: typeof FileText;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-[#f5f6f9]"
      onClick={onClick}
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-[#f1f2f6] text-[#7f89a0]">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-semibold text-[#4b5568]">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] text-[#9aa1ad]">
          {detail}
        </span>
      </span>
      <ArrowUpRight className="size-3.5 text-[#b0b5bf]" />
    </button>
  );
}

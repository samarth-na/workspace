"use client";

import {
  FileText,
  FolderPlus,
  ListTodo,
  MessageCircle,
  Upload,
  Video,
} from "lucide-react";
import { requestFilePick, requestNewFolder } from "@/lib/file-pick";

export function CreateMenu({
  onClose,
  onAction,
  onNavigate,
}: {
  onClose: () => void;
  onAction: (message: string) => void;
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-20">
      <button
        type="button"
        aria-label="Close create menu"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="absolute right-5 top-[62px] w-56 rounded-xl border border-[#e3e5ea] bg-white p-1.5 shadow-[0_12px_30px_rgba(35,43,66,0.13)] sm:right-8">
        <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
          Create new
        </p>
        <CreateItem
          icon={FileText}
          label="Document"
          onClick={() => {
            onNavigate("/files");
            onAction("New document created");
            onClose();
          }}
        />
        <CreateItem
          icon={ListTodo}
          label="New task"
          onClick={() => {
            onNavigate("/tasks");
            onAction("New task composer opened");
            onClose();
          }}
        />
        <CreateItem
          icon={Upload}
          label="Upload files"
          onClick={() => {
            onNavigate("/files");
            requestFilePick();
            onClose();
          }}
        />
        <CreateItem
          icon={FolderPlus}
          label="New folder"
          onClick={() => {
            onNavigate("/files");
            requestNewFolder();
            onClose();
          }}
        />
        <CreateItem
          icon={Video}
          label="Start a call"
          onClick={() => {
            onNavigate("/calls");
            onAction("Starting a new call");
            onClose();
          }}
        />
        <CreateItem
          icon={MessageCircle}
          label="New message"
          onClick={() => {
            onNavigate("/messages");
            onAction("New message composer opened");
            onClose();
          }}
        />
      </div>
    </div>
  );
}

function CreateItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FileText;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
      onClick={onClick}
    >
      <Icon className="size-4 text-[#8b94a5]" strokeWidth={1.8} />
      {label}
    </button>
  );
}

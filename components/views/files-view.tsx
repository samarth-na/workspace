"use client";

import {
  Download,
  FileArchive,
  FileAudio,
  FileCode,
  FileText,
  FileVideo,
  Grid2X2,
  Image as ImageIcon,
  List,
  MoreHorizontal,
  Presentation,
  Table2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ViewFrame } from "@/components/shared/view-frame";
import { useShell } from "@/components/shell/shell-context";
import { consumeFilePickRequest } from "@/lib/file-pick";
import type {
  FileItem,
  FilesResponse,
  UploadFileResponse,
} from "@/lib/file-types";
import { cn } from "@/lib/utils";

type FileTone = "indigo" | "orange" | "green" | "rose";
type FileKind =
  | "image"
  | "pdf"
  | "sheet"
  | "slides"
  | "archive"
  | "video"
  | "audio"
  | "code"
  | "doc";

const TONES: Record<FileTone, string> = {
  indigo: "bg-[#eef0ff] text-[#6670d5]",
  orange: "bg-[#fff1e5] text-[#d28a4d]",
  green: "bg-[#eaf5ec] text-[#5b9a6b]",
  rose: "bg-[#fbecef] text-[#c87489]",
};

const KINDS: Record<
  FileKind,
  { icon: typeof FileText; tone: FileTone; label: string }
> = {
  image: { icon: ImageIcon, tone: "orange", label: "Image" },
  pdf: { icon: FileText, tone: "rose", label: "PDF" },
  sheet: { icon: Table2, tone: "green", label: "Sheet" },
  slides: { icon: Presentation, tone: "indigo", label: "Slides" },
  archive: { icon: FileArchive, tone: "indigo", label: "Archive" },
  video: { icon: FileVideo, tone: "indigo", label: "Video" },
  audio: { icon: FileAudio, tone: "indigo", label: "Audio" },
  code: { icon: FileCode, tone: "indigo", label: "Text" },
  doc: { icon: FileText, tone: "indigo", label: "Document" },
};

const MAX_FILE_SIZE = 25 * 1024 * 1024;

function kindFor(file: FileItem): FileKind {
  const mime = file.mimeType;
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    mime.includes("spreadsheet") ||
    ["xls", "xlsx", "csv", "ods"].includes(ext)
  ) {
    return "sheet";
  }
  if (mime.includes("presentation") || ["ppt", "pptx", "key"].includes(ext)) {
    return "slides";
  }
  if (mime.includes("zip") || ["zip", "tar", "gz", "rar", "7z"].includes(ext)) {
    return "archive";
  }
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (
    mime.startsWith("text/") ||
    [
      "md",
      "json",
      "js",
      "ts",
      "tsx",
      "jsx",
      "html",
      "css",
      "yml",
      "yaml",
      "toml",
      "xml",
    ].includes(ext)
  ) {
    return "code";
  }
  return "doc";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function timeAgo(timestamp: number) {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const date = new Date(timestamp);
  return `Updated ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

type UploadTask = { id: string; name: string; progress: number };

function FilesView() {
  const { notify } = useShell();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [grid, setGrid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef(isPreview);
  previewRef.current = isPreview;

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to load files");
      const data = (await res.json()) as FilesResponse;
      setFiles(data.files);
      setIsPreview(data.isPreview);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pickFiles = useCallback(() => {
    if (previewRef.current) {
      notify("Sign in to upload files");
      return;
    }
    inputRef.current?.click();
  }, [notify]);

  useEffect(() => {
    if (consumeFilePickRequest()) pickFiles();
    window.addEventListener("workspace:pick-files", pickFiles);
    return () => window.removeEventListener("workspace:pick-files", pickFiles);
  }, [pickFiles]);

  const startUpload = useCallback(
    (fileItem: File, taskId: string) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", fileItem);
      xhr.open("POST", "/api/files");
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploads((prev) =>
          prev.map((u) => (u.id === taskId ? { ...u, progress } : u)),
        );
      };
      xhr.onload = () => {
        let body: UploadFileResponse | { error?: string } = {};
        try {
          body = JSON.parse(xhr.responseText);
        } catch {
          body = {};
        }
        if (xhr.status >= 200 && xhr.status < 300 && "file" in body) {
          setFiles((prev) => [body.file, ...prev]);
          notify(`Uploaded ${fileItem.name}`);
        } else {
          notify((body as { error?: string }).error ?? "Upload failed");
        }
        setUploads((prev) => prev.filter((u) => u.id !== taskId));
      };
      xhr.onerror = () => {
        notify(`Upload failed for ${fileItem.name}`);
        setUploads((prev) => prev.filter((u) => u.id !== taskId));
      };
      xhr.send(form);
    },
    [notify],
  );

  const handleFiles = useCallback(
    (selected: File[]) => {
      if (previewRef.current) {
        notify("Sign in to upload files");
        return;
      }
      for (const fileItem of selected) {
        if (fileItem.size > MAX_FILE_SIZE) {
          notify(`${fileItem.name} exceeds the 25 MB limit`);
          continue;
        }
        const taskId = crypto.randomUUID();
        setUploads((prev) => [
          ...prev,
          { id: taskId, name: fileItem.name, progress: 0 },
        ]);
        startUpload(fileItem, taskId);
      }
    },
    [notify, startUpload],
  );

  const handleDelete = useCallback(
    async (fileItem: FileItem) => {
      try {
        const res = await fetch(`/api/files/${fileItem.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          notify("Could not delete file");
          return;
        }
        setFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
        notify(`Deleted ${fileItem.name}`);
      } catch {
        notify("Could not delete file");
      } finally {
        setMenuFor(null);
      }
    },
    [notify],
  );

  const openFile = useCallback((fileItem: FileItem) => {
    window.open(fileItem.url, "_blank");
  }, []);

  return (
    <ViewFrame
      title="Files"
      description="A shared home for documents, images, and project assets."
      action="Upload file"
      onAction={pickFiles}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files;
          if (selected) handleFiles(Array.from(selected));
          event.target.value = "";
        }}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drop target for drag-and-drop, not keyboard-interactive */}
      <div
        className="relative"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const dropped = Array.from(event.dataTransfer.files);
          if (dropped.length > 0) handleFiles(dropped);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-[#8c94a4]">
            <span className="font-medium text-[#4e576a]">All files</span>
            <span>/</span>
            <span>Shared with everyone</span>
          </div>
          <div className="flex rounded-lg border border-[#e2e4e9] bg-white p-0.5">
            <button
              type="button"
              aria-label="List view"
              className={cn(
                "rounded-md p-1.5",
                !grid ? "bg-[#eef0ff] text-[#5b64d6]" : "text-[#9aa1ad]",
              )}
              onClick={() => setGrid(false)}
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              className={cn(
                "rounded-md p-1.5",
                grid ? "bg-[#eef0ff] text-[#5b64d6]" : "text-[#9aa1ad]",
              )}
              onClick={() => setGrid(true)}
            >
              <Grid2X2 className="size-3.5" />
            </button>
          </div>
        </div>

        {uploads.length > 0 && (
          <div className="mb-3 space-y-2">
            {uploads.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-[#e5e7ec] bg-white px-4 py-2.5"
              >
                <UploadCloud className="size-4 shrink-0 text-[#8b94a5]" />
                <span className="min-w-0 flex-1 truncate text-[12px] text-[#596275]">
                  {task.name}
                </span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#eef0f4]">
                  <div
                    className="h-full rounded-full bg-[#5b64d6] transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
                <span className="w-9 text-right text-[11px] tabular-nums text-[#9aa1ad]">
                  {task.progress}%
                </span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl border border-[#eef0f3] bg-white"
              />
            ))}
          </div>
        ) : files.length === 0 ? (
          <button
            type="button"
            onClick={pickFiles}
            className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#e0e3ea] bg-white px-6 py-14 text-center transition-colors hover:border-[#c8cdd9] hover:bg-[#fafbff]"
          >
            <UploadCloud className="size-7 text-[#9aa1ad]" strokeWidth={1.5} />
            <span className="text-[13px] font-semibold text-[#414a5d]">
              Drop files here to upload
            </span>
            <span className="text-[12px] text-[#9aa1ad]">
              Documents, images, and more — up to 25 MB each
            </span>
          </button>
        ) : grid ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {files.map((fileItem) => (
              <FileCard
                file={fileItem}
                key={fileItem.id}
                menuOpen={menuFor === fileItem.id}
                onOpenMenu={() => setMenuFor(fileItem.id)}
                onOpen={openFile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
            <div className="hidden grid-cols-[minmax(210px,1.4fr)_0.8fr_0.7fr_32px] gap-4 border-b border-[#eff0f3] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#a0a6b2] sm:grid">
              <span>Name</span>
              <span>Type</span>
              <span>Updated</span>
              <span />
            </div>
            {files.map((fileItem) => (
              <FileRow
                file={fileItem}
                key={fileItem.id}
                menuOpen={menuFor === fileItem.id}
                onOpenMenu={() => setMenuFor(fileItem.id)}
                onOpen={openFile}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#5b64d6] bg-[#5b64d6]/5">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-[#4e57c5]">
              <UploadCloud className="size-5" /> Drop files to upload
            </p>
          </div>
        )}
      </div>
    </ViewFrame>
  );
}

function FileRow({
  file,
  menuOpen,
  onOpenMenu,
  onOpen,
  onDelete,
}: {
  file: FileItem;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onOpen: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}) {
  const { icon: Icon, tone, label } = KINDS[kindFor(file)];
  return (
    // biome-ignore lint/a11y/useSemanticElements: contains nested interactive menu, button nesting is invalid HTML
    <div
      className="grid grid-cols-1 gap-2 border-b border-[#eff0f3] px-4 py-3.5 last:border-b-0 hover:bg-[#fafaff] sm:grid-cols-[minmax(210px,1.4fr)_0.8fr_0.7fr_32px] sm:items-center sm:gap-4 sm:px-5"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(file)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(file);
      }}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            TONES[tone],
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-[#414a5d]">
            {file.name}
          </span>
          <span className="mt-0.5 block text-[11px] text-[#a0a6b2] sm:hidden">
            {label} · {formatBytes(file.size)}
          </span>
        </span>
      </span>
      <span className="hidden text-[12px] text-[#8f97a6] sm:block">
        {label} · {formatBytes(file.size)}
      </span>
      <span className="hidden text-[12px] text-[#8f97a6] sm:block">
        {timeAgo(file.createdAt)}
      </span>
      <FileMenu
        open={menuOpen}
        onToggle={onOpenMenu}
        onDownload={() => window.open(file.url, "_blank")}
        onDelete={() => onDelete(file)}
      />
    </div>
  );
}

function FileCard({
  file,
  menuOpen,
  onOpenMenu,
  onOpen,
  onDelete,
}: {
  file: FileItem;
  menuOpen: boolean;
  onOpenMenu: () => void;
  onOpen: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}) {
  const { icon: Icon, label } = KINDS[kindFor(file)];
  const isImage = file.mimeType.startsWith("image/");
  return (
    // biome-ignore lint/a11y/useSemanticElements: contains nested interactive menu, button nesting is invalid HTML
    <div
      role="button"
      tabIndex={0}
      className="group relative cursor-pointer rounded-2xl border border-[#e5e7ec] bg-white p-4 text-left shadow-[0_2px_7px_rgba(32,41,60,0.025)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(32,41,60,0.06)]"
      onClick={() => onOpen(file)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(file);
      }}
    >
      <span className="relative flex h-28 items-center justify-center overflow-hidden rounded-xl bg-[#f5f6f9]">
        {isImage ? (
          <Image
            src={file.url}
            alt={file.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <Icon className="size-8 text-[#8a93a5]" strokeWidth={1.4} />
        )}
      </span>
      <p className="mt-4 truncate text-[13px] font-semibold text-[#414a5d]">
        {file.name}
      </p>
      <p className="mt-1 text-[11px] text-[#9da4b1]">
        {label} · {formatBytes(file.size)} · {timeAgo(file.createdAt)}
      </p>
      <span className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        <FileMenu
          open={menuOpen}
          onToggle={onOpenMenu}
          onDownload={() => window.open(file.url, "_blank")}
          onDelete={() => onDelete(file)}
        />
      </span>
    </div>
  );
}

function FileMenu({
  open,
  onToggle,
  onDownload,
  onDelete,
}: {
  open: boolean;
  onToggle: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <span className="relative flex justify-end">
      <button
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        className="rounded-md p-1 text-[#a6acb7] transition-colors hover:bg-[#eef0f4] hover:text-[#596275]"
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default"
            onClick={onToggle}
          />
          <div className="absolute right-0 top-9 z-40 w-36 rounded-xl border border-[#e3e5ea] bg-white p-1 shadow-[0_12px_30px_rgba(35,43,66,0.13)]">
            <MenuAction
              icon={Download}
              label="Download"
              onClick={() => {
                onToggle();
                onDownload();
              }}
            />
            <MenuAction
              icon={Trash2}
              label="Delete"
              tone="danger"
              onClick={() => onDelete()}
            />
          </div>
        </>
      )}
    </span>
  );
}

function MenuAction({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof Download;
  label: string;
  tone?: "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] hover:bg-[#f4f5f8]",
        tone === "danger"
          ? "text-[#c04a5d] hover:bg-[#fdf0f2]"
          : "text-[#596275]",
      )}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}

export { FilesView };

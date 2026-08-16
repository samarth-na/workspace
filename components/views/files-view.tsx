"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowsVertical,
  ArrowUp,
  ChevronRight,
  Close,
  Database,
  Download,
  FileText,
  Folder,
  FolderPlus,
  Grid2x22,
  ListBox,
  Search,
  Trash,
  Upload,
} from "pixelarticons/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FileGlyph,
  type FileGlyphVariant,
} from "@/components/files/file-glyphs";
import { FileMenu, type MenuItemDef } from "@/components/files/file-menu";
import { MoveDialog, type MoveTarget } from "@/components/files/move-dialog";
import { PreviewDialog } from "@/components/files/preview-dialog";
import { ViewFrame } from "@/components/shared/view-frame";
import { useShell } from "@/components/shell/shell-context";
import {
  consumeFilePickRequest,
  consumeNewFolderRequest,
} from "@/lib/file-pick";
import type {
  FileItem,
  FolderContentsResponse,
  FolderItem,
  FolderPathItem,
  UploadFileResponse,
  WorkspaceStorage,
} from "@/lib/file-types";
import { useUploadThing } from "@/lib/uploadthing-client";
import { cn } from "@/lib/utils";

type FileTone = "indigo" | "orange" | "green" | "rose";
type FileKind =
  | "folder"
  | "image"
  | "pdf"
  | "sheet"
  | "slides"
  | "archive"
  | "video"
  | "audio"
  | "code"
  | "doc";
type ViewId = "compact" | "grid";
type SortKey = "name" | "modified" | "type" | "size";
type SortDir = "asc" | "desc";
type Entry =
  | { kind: "folder"; item: FolderItem }
  | { kind: "file"; item: FileItem };
type EntryId = { kind: "folder" | "file"; id: string };

const TONES: Record<FileTone, string> = {
  indigo: "bg-[#eef0ff] text-[#6670d5]",
  orange: "bg-[#fff1e5] text-[#d28a4d]",
  green: "bg-[#eaf5ec] text-[#5b9a6b]",
  rose: "bg-[#fbecef] text-[#c87489]",
};

const KINDS: Record<
  FileKind,
  { glyph: FileGlyphVariant; tone: FileTone; label: string }
> = {
  folder: { glyph: "folder", tone: "indigo", label: "Folder" },
  image: { glyph: "doc", tone: "orange", label: "Image" },
  pdf: { glyph: "pdf", tone: "rose", label: "PDF" },
  sheet: { glyph: "sheet", tone: "green", label: "Sheet" },
  slides: { glyph: "slides", tone: "orange", label: "Slides" },
  archive: { glyph: "archive", tone: "indigo", label: "Archive" },
  video: { glyph: "video", tone: "indigo", label: "Video" },
  audio: { glyph: "audio", tone: "indigo", label: "Audio" },
  code: { glyph: "code", tone: "indigo", label: "Text" },
  doc: { glyph: "doc", tone: "indigo", label: "Document" },
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "modified", label: "Modified" },
  { key: "type", label: "Type" },
  { key: "size", label: "Size" },
];

const MAX_FILE_SIZE = 32 * 1024 * 1024;

function kindFor(item: { mimeType?: string; name: string }): FileKind {
  if (!item.mimeType) return "folder";
  const mime = item.mimeType;
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  const ext = item.name.split(".").pop()?.toLowerCase() ?? "";
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
type RenameTarget = { kind: "folder" | "file"; id: string; name: string };

function FilesView() {
  const { notify } = useShell();
  const [folderId, setFolderId] = useState<string | null>(null);
  const [crumbs, setCrumbs] = useState<FolderPathItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [storage, setStorage] = useState<WorkspaceStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreview, setIsPreview] = useState(true);
  const [view, setView] = useState<ViewId>("grid");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: "modified",
    dir: "desc",
  });
  const [search, setSearch] = useState("");
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [menuFor, setMenuFor] = useState<EntryId | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveTarget, setMoveTarget] = useState<MoveTarget | null>(null);
  const [allFolders, setAllFolders] = useState<FolderItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const newFolderRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef(isPreview);
  previewRef.current = isPreview;
  const folderIdRef = useRef(folderId);
  folderIdRef.current = folderId;

  const load = useCallback(async (target: string | null) => {
    setLoading(true);
    try {
      const query = target ? `?folder=${encodeURIComponent(target)}` : "";
      const res = await fetch(`/api/files${query}`);
      if (!res.ok) throw new Error("Failed to load files");
      const data = (await res.json()) as FolderContentsResponse;
      setFolderId(target);
      setCrumbs(data.path);
      setFolders(data.folders);
      setFiles(data.files);
      setStorage(data.storage);
      setIsPreview(data.isPreview);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchParams = useSearchParams();
  const initialFolder = searchParams.get("folder");

  useEffect(() => {
    load(initialFolder && initialFolder !== "all" ? initialFolder : null);
  }, [load, initialFolder]);

  const navigate = useCallback(
    (target: string | null) => {
      setSelected(new Set());
      setMenuFor(null);
      load(target);
    },
    [load],
  );

  const pickFiles = useCallback(() => {
    if (previewRef.current) {
      notify("Sign in to upload files");
      return;
    }
    inputRef.current?.click();
  }, [notify]);

  const beginCreateFolder = useCallback(() => {
    if (previewRef.current) {
      notify("Sign in to create folders");
      return;
    }
    setNewFolderName("");
    setCreatingFolder(true);
  }, [notify]);

  useEffect(() => {
    if (consumeFilePickRequest()) pickFiles();
    if (consumeNewFolderRequest()) beginCreateFolder();
    window.addEventListener("workspace:pick-files", pickFiles);
    window.addEventListener("workspace:new-folder", beginCreateFolder);
    return () => {
      window.removeEventListener("workspace:pick-files", pickFiles);
      window.removeEventListener("workspace:new-folder", beginCreateFolder);
    };
  }, [pickFiles, beginCreateFolder]);

  useEffect(() => {
    if (creatingFolder) {
      newFolderRef.current?.focus();
    }
  }, [creatingFolder]);

  const taskFilesRef = useRef(
    new Map<string, { file: File; folderId: string | null }>(),
  );

  const { startUpload } = useUploadThing("fileUploader", {
    onUploadProgress: (progress) => {
      setUploads((prev) => prev.map((u) => ({ ...u, progress })));
    },
    onClientUploadComplete: async (res) => {
      for (const uploaded of res) {
        let taskId: string | null = null;
        let folderId: string | null = null;
        for (const [id, task] of taskFilesRef.current) {
          if (
            task.file.name === uploaded.name &&
            task.file.size === uploaded.size
          ) {
            taskId = id;
            folderId = task.folderId;
            break;
          }
        }
        if (!taskId) continue;
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: uploaded.key,
              name: uploaded.name,
              size: uploaded.size,
              mimeType: uploaded.type,
              folderId,
            }),
          });
          if (response.ok) {
            const data = (await response.json()) as UploadFileResponse;
            setFiles((prev) => [data.file, ...prev]);
            setStorage((prev) =>
              prev ? { ...prev, used: prev.used + uploaded.size } : prev,
            );
            notify(`Uploaded ${uploaded.name}`);
          } else {
            const body = (await response.json().catch(() => null)) as {
              error?: string;
            } | null;
            notify(body?.error ?? "Upload failed");
          }
        } catch {
          notify(`Upload failed for ${uploaded.name}`);
        } finally {
          taskFilesRef.current.delete(taskId);
          setUploads((prev) => prev.filter((u) => u.id !== taskId));
        }
      }
    },
    onUploadError: (error) => {
      notify(error.message);
      taskFilesRef.current.clear();
      setUploads([]);
    },
  });

  const handleFiles = useCallback(
    (selectedFiles: File[]) => {
      if (previewRef.current) {
        notify("Sign in to upload files");
        return;
      }
      const accepted: File[] = [];
      for (const fileItem of selectedFiles) {
        if (fileItem.size > MAX_FILE_SIZE) {
          notify(`${fileItem.name} exceeds the 32 MB limit`);
          continue;
        }
        const taskId = crypto.randomUUID();
        taskFilesRef.current.set(taskId, {
          file: fileItem,
          folderId: folderIdRef.current,
        });
        setUploads((prev) => [
          ...prev,
          { id: taskId, name: fileItem.name, progress: 0 },
        ]);
        accepted.push(fileItem);
      }
      if (accepted.length > 0) void startUpload(accepted);
    },
    [notify, startUpload],
  );

  const commitCreateFolder = useCallback(async () => {
    const name = newFolderName.trim();
    setCreatingFolder(false);
    if (name.length === 0) return;
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: folderIdRef.current }),
    });
    if (!res.ok) {
      notify("Could not create folder");
      return;
    }
    notify(`Created ${name}`);
    load(folderIdRef.current);
  }, [newFolderName, notify, load]);

  const beginRename = useCallback(
    (entry: Entry) => {
      if (previewRef.current) {
        notify("Sign in to rename items");
        return;
      }
      setRenameTarget({
        kind: entry.kind,
        id: entry.item.id,
        name: entry.item.name,
      });
      setRenameValue(entry.item.name);
    },
    [notify],
  );

  const commitRename = useCallback(async () => {
    const target = renameTarget;
    const name = renameValue.trim();
    setRenameTarget(null);
    if (!target || name.length === 0 || name === target.name) return;
    const path =
      target.kind === "file"
        ? `/api/files/${target.id}`
        : `/api/folders/${target.id}`;
    const res = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      notify("Could not rename");
      return;
    }
    if (target.kind === "file") {
      setFiles((prev) =>
        prev.map((f) => (f.id === target.id ? { ...f, name } : f)),
      );
    } else {
      setFolders((prev) =>
        prev.map((f) => (f.id === target.id ? { ...f, name } : f)),
      );
      setCrumbs((prev) =>
        prev.map((c) => (c.id === target.id ? { ...c, name } : c)),
      );
    }
    notify(`Renamed to ${name}`);
  }, [renameTarget, renameValue, notify]);

  const openMove = useCallback(
    async (entry: Entry) => {
      if (previewRef.current) {
        notify("Sign in to move items");
        return;
      }
      setMoveTarget({
        kind: entry.kind,
        id: entry.item.id,
        name: entry.item.name,
      });
      try {
        const res = await fetch("/api/folders?all=1");
        if (res.ok) {
          const data = (await res.json()) as { folders: FolderItem[] };
          setAllFolders(data.folders);
        }
      } catch {
        setAllFolders([]);
      }
    },
    [notify],
  );

  const commitMove = useCallback(
    async (destination: string | null) => {
      const target = moveTarget;
      if (!target) return;
      const path =
        target.kind === "file"
          ? `/api/files/${target.id}`
          : `/api/folders/${target.id}`;
      const body =
        target.kind === "file"
          ? { folderId: destination }
          : { parentId: destination };
      const res = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Could not move");
      }
      notify(`Moved ${target.name}`);
      load(folderIdRef.current);
    },
    [moveTarget, notify, load],
  );

  const deleteEntries = useCallback(
    async (entries: Entry[]) => {
      if (previewRef.current) {
        notify("Sign in to delete items");
        return;
      }
      for (const entry of entries) {
        const path =
          entry.kind === "file"
            ? `/api/files/${entry.item.id}`
            : `/api/folders/${entry.item.id}`;
        const res = await fetch(path, { method: "DELETE" });
        if (!res.ok) {
          notify(`Could not delete ${entry.item.name}`);
          return;
        }
      }
      const freedBytes = entries
        .filter((entry) => entry.kind === "file")
        .reduce((sum, entry) => sum + entry.item.size, 0);
      if (freedBytes > 0) {
        setStorage((prev) =>
          prev ? { ...prev, used: Math.max(0, prev.used - freedBytes) } : prev,
        );
      }
      setSelected((prev) => {
        const next = new Set(prev);
        for (const entry of entries) next.delete(entry.item.id);
        return next;
      });
      if (entries.some((entry) => entry.kind === "file")) {
        setFiles((prev) => {
          const ids = new Set(
            entries.filter((e) => e.kind === "file").map((e) => e.item.id),
          );
          return prev.filter((f) => !ids.has(f.id));
        });
      }
      if (entries.some((entry) => entry.kind === "folder")) {
        const ids = new Set(
          entries.filter((e) => e.kind === "folder").map((e) => e.item.id),
        );
        setFolders((prev) => prev.filter((f) => !ids.has(f.id)));
      }
      notify(
        entries.length > 1
          ? `Deleted ${entries.length} items`
          : `Deleted ${entries[0].item.name}`,
      );
    },
    [notify],
  );

  const [previewId, setPreviewId] = useState<string | null>(null);

  const openEntry = useCallback(
    (entry: Entry) => {
      if (entry.kind === "folder") {
        navigate(entry.item.id);
      } else if (entry.item.mimeType.startsWith("image/")) {
        setPreviewId(entry.item.id);
      } else {
        window.open(entry.item.url, "_blank");
      }
    },
    [navigate],
  );

  const toggleSelected = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const query = search.trim().toLowerCase();
    return files.filter((f) => f.name.toLowerCase().includes(query));
  }, [files, search]);

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders;
    const query = search.trim().toLowerCase();
    return folders.filter((f) => f.name.toLowerCase().includes(query));
  }, [folders, search]);

  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sort.key === "name") {
        cmp = a.name.localeCompare(b.name);
      } else if (sort.key === "size") {
        cmp = a.size - b.size;
      } else if (sort.key === "type") {
        cmp =
          KINDS[kindFor(a)].label.localeCompare(KINDS[kindFor(b)].label) ||
          a.name.localeCompare(b.name);
      } else {
        cmp = a.createdAt - b.createdAt;
      }
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredFiles, sort]);

  const entries = useMemo<Entry[]>(() => {
    const folderEntries: Entry[] = filteredFolders.map((item) => ({
      kind: "folder",
      item,
    }));
    const fileEntries: Entry[] = sortedFiles.map((item) => ({
      kind: "file",
      item,
    }));
    return [...folderEntries, ...fileEntries];
  }, [filteredFolders, sortedFiles]);

  const selectedEntries = useMemo<Entry[]>(() => {
    const folderById = new Map(folders.map((f) => [f.id, f]));
    const fileById = new Map(files.map((f) => [f.id, f]));
    const result: Entry[] = [];
    for (const id of selected) {
      const folderItem = folderById.get(id);
      if (folderItem) {
        result.push({ kind: "folder", item: folderItem });
        continue;
      }
      const fileItem = fileById.get(id);
      if (fileItem) result.push({ kind: "file", item: fileItem });
    }
    return result;
  }, [selected, folders, files]);

  const pickSort = useCallback((key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" },
    );
    setSortMenuOpen(false);
  }, []);

  const menuItemsFor = useCallback(
    (entry: Entry): MenuItemDef[] => {
      const items: MenuItemDef[] = [];
      if (entry.kind === "file") {
        items.push({
          icon: Download,
          label: "Download",
          onSelect: () => window.open(entry.item.url, "_blank"),
        });
      }
      items.push(
        {
          icon: FileText,
          label: "Rename",
          onSelect: () => beginRename(entry),
        },
        {
          icon: Folder,
          label: "Move to…",
          onSelect: () => openMove(entry),
        },
        {
          icon: Trash,
          label: "Delete",
          danger: true,
          onSelect: () => deleteEntries([entry]),
        },
      );
      return items;
    },
    [beginRename, openMove, deleteEntries],
  );

  const previewImages = useMemo(
    () =>
      entries.flatMap((entry) =>
        entry.kind === "file" && entry.item.mimeType.startsWith("image/")
          ? [entry.item]
          : [],
      ),
    [entries],
  );

  const storagePct = useMemo(
    () =>
      storage
        ? Math.min(100, Math.round((storage.used / storage.limit) * 100))
        : 0,
    [storage],
  );

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
          const selectedFiles = event.target.files;
          if (selectedFiles) handleFiles(Array.from(selectedFiles));
          event.target.value = "";
        }}
      />
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drop target for drag-and-drop, not keyboard-interactive */}
      <div
        className="relative"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!event.dataTransfer.types.includes("Files")) return;
          const dropped = Array.from(event.dataTransfer.files);
          if (dropped.length > 0) handleFiles(dropped);
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 text-[12px] text-[#8c94a4]">
            <button
              type="button"
              className={cn(
                "font-medium transition-colors hover:text-[#4e576a]",
                !folderId ? "text-[#4e576a]" : "",
              )}
              onClick={() => navigate(null)}
            >
              All files
            </button>
            {crumbs.map((crumb) => (
              <span
                key={crumb.id}
                className="flex min-w-0 items-center gap-1.5"
              >
                <ChevronRight className="size-3 shrink-0 text-[#c0c6d1]" />
                <button
                  type="button"
                  className="max-w-40 truncate font-medium transition-colors hover:text-[#4e576a]"
                  onClick={() => navigate(crumb.id)}
                >
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#a1a8b5]" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search files"
                aria-label="Search files"
                className="h-8 w-40 rounded-lg border border-[#e2e4e9] bg-white pl-8 pr-2 text-[12px] text-[#414a5d] outline-none transition placeholder:text-[#a1a8b5] focus:border-[#5b64d6] sm:w-48"
              />
            </label>
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e4e9] bg-white px-2.5 text-[12px] font-medium text-[#596275] transition-colors hover:bg-[#f6f7f9]"
              onClick={beginCreateFolder}
            >
              <FolderPlus className="size-3.5 text-[#8b94a5]" />
              <span className="hidden sm:inline">New folder</span>
            </button>
            <div className="relative">
              <button
                type="button"
                aria-expanded={sortMenuOpen}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[#e2e4e9] bg-white px-2.5 text-[12px] font-medium text-[#596275] transition-colors hover:bg-[#f6f7f9]"
                onClick={() => setSortMenuOpen((prev) => !prev)}
              >
                <ArrowsVertical className="size-3.5 text-[#8b94a5]" />
                <span className="hidden sm:inline">
                  {SORT_OPTIONS.find((o) => o.key === sort.key)?.label}
                </span>
                {sort.dir === "asc" ? (
                  <ArrowUp className="size-3 text-[#8b94a5]" />
                ) : (
                  <ArrowDown className="size-3 text-[#8b94a5]" />
                )}
              </button>
              {sortMenuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close sort menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setSortMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-9 z-40 w-44 rounded-xl border border-[#e3e5ea] bg-white p-1 shadow-[0_12px_30px_rgba(35,43,66,0.13)]">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[12px] text-[#596275] hover:bg-[#f4f5f8]"
                        onClick={() => pickSort(option.key)}
                      >
                        {option.label}
                        {sort.key === option.key &&
                          (sort.dir === "asc" ? (
                            <ArrowUp className="size-3.5 text-[#5b64d6]" />
                          ) : (
                            <ArrowDown className="size-3.5 text-[#5b64d6]" />
                          ))}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex rounded-lg border border-[#e2e4e9] bg-white p-0.5">
              <ViewToggle
                icon={ListBox}
                label="List view"
                active={view === "compact"}
                onClick={() => setView("compact")}
              />
              <ViewToggle
                icon={Grid2x22}
                label="Grid view"
                active={view === "grid"}
                onClick={() => setView("grid")}
              />
            </div>
          </div>
        </div>

        {uploads.length > 0 && (
          <div className="mb-3 space-y-2">
            {uploads.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-[#e5e7ec] bg-white px-4 py-2.5"
              >
                <Upload className="size-4 shrink-0 text-[#8b94a5]" />
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

        {selected.size > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-xl border border-[#e2e4e9] bg-[#f7f8fd] px-4 py-2">
            <p className="text-[12px] font-semibold text-[#414a5d]">
              {selected.size} selected
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[#c04a5d] transition-colors hover:bg-[#fdf0f2]"
                onClick={() => deleteEntries(selectedEntries)}
              >
                <Trash className="size-3.5" />
                Delete
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-[#596275] transition-colors hover:bg-[#eef0f4]"
                onClick={() => setSelected(new Set())}
              >
                <Close className="size-3.5" />
                Clear
              </button>
            </div>
          </div>
        )}

        {creatingFolder && (
          <div className="mb-2 flex items-center gap-3 rounded-xl border border-[#5b64d6]/40 bg-white px-4 py-3">
            <Folder className="size-4 shrink-0 text-[#6670d5]" />
            <RenameInput
              value={newFolderName}
              onChange={setNewFolderName}
              onCommit={commitCreateFolder}
              onCancel={() => setCreatingFolder(false)}
              ref={newFolderRef}
            />
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
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-[#e0e3ea] bg-white px-6 py-14 text-center">
            <Upload className="size-7 text-[#9aa1ad]" />
            <div>
              <p className="text-[13px] font-semibold text-[#414a5d]">
                {search.trim()
                  ? `No matches for “${search.trim()}”`
                  : "This folder is empty"}
              </p>
              <p className="mt-1 text-[12px] text-[#9aa1ad]">
                Drop files here, or create a folder to organize them.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-[#5b64d6] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4e57c5]"
                onClick={pickFiles}
              >
                Upload files
              </button>
              <button
                type="button"
                className="rounded-lg border border-[#e2e4e9] bg-white px-3 py-2 text-[12px] font-semibold text-[#596275] transition-colors hover:bg-[#f6f7f9]"
                onClick={beginCreateFolder}
              >
                New folder
              </button>
            </div>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-1">
            {entries.map((entry) => (
              <GridCard
                key={`${entry.kind}-${entry.item.id}`}
                entry={entry}
                preview={isPreview}
                selected={selected.has(entry.item.id)}
                menuOpen={
                  menuFor?.kind === entry.kind && menuFor.id === entry.item.id
                }
                menuItems={menuItemsFor(entry)}
                renaming={
                  renameTarget?.kind === entry.kind &&
                  renameTarget.id === entry.item.id
                }
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameCommit={commitRename}
                onRenameCancel={() => setRenameTarget(null)}
                onOpenMenu={() =>
                  setMenuFor({ kind: entry.kind, id: entry.item.id })
                }
                onOpen={() => openEntry(entry)}
                onToggleSelect={() => toggleSelected(entry.item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#e5e7ec] bg-white shadow-[0_2px_7px_rgba(32,41,60,0.025)]">
            {entries.map((entry) => (
              <ListRow
                key={`${entry.kind}-${entry.item.id}`}
                entry={entry}
                preview={isPreview}
                selected={selected.has(entry.item.id)}
                menuOpen={
                  menuFor?.kind === entry.kind && menuFor.id === entry.item.id
                }
                menuItems={menuItemsFor(entry)}
                renaming={
                  renameTarget?.kind === entry.kind &&
                  renameTarget.id === entry.item.id
                }
                renameValue={renameValue}
                onRenameChange={setRenameValue}
                onRenameCommit={commitRename}
                onRenameCancel={() => setRenameTarget(null)}
                onOpenMenu={() =>
                  setMenuFor({ kind: entry.kind, id: entry.item.id })
                }
                onOpen={() => openEntry(entry)}
                onToggleSelect={() => toggleSelected(entry.item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {moveTarget && (
        <MoveDialog
          target={moveTarget}
          allFolders={allFolders}
          onClose={() => setMoveTarget(null)}
          onMove={commitMove}
        />
      )}

      {previewId && (
        <PreviewDialog
          images={previewImages}
          initialId={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}

      {storage ? (
        <div
          className="fixed bottom-4 right-4 z-30 flex items-center gap-2.5 rounded-xl border border-[#e3e5ea] bg-white/95 px-3 py-2 shadow-[0_8px_24px_rgba(35,43,66,0.12)] backdrop-blur"
          title={`${formatBytes(storage.used)} of ${formatBytes(storage.limit)} used`}
        >
          <Database className="size-4 shrink-0 text-[#8b94a5]" />
          <div className="w-40">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[11px] font-medium text-[#596275]">
                {formatBytes(storage.used)}
              </p>
              <p className="text-[10px] text-[#9aa1ad]">
                of {formatBytes(storage.limit)}
              </p>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#eef0f4]">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  storagePct >= 100
                    ? "bg-[#d84c6b]"
                    : storagePct >= 80
                      ? "bg-[#d28a4d]"
                      : "bg-[#5b64d6]",
                )}
                style={{ width: `${storagePct}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </ViewFrame>
  );
}

function ViewToggle({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof ListBox;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "rounded-md p-1.5 transition-colors",
        active
          ? "bg-[#eef0ff] text-[#5b64d6]"
          : "text-[#9aa1ad] hover:text-[#596275]",
      )}
      onClick={onClick}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function ListRow({
  entry,
  preview,
  selected,
  menuOpen,
  menuItems,
  renaming,
  renameValue,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onOpenMenu,
  onOpen,
  onToggleSelect,
}: {
  entry: Entry;
  preview: boolean;
  selected: boolean;
  menuOpen: boolean;
  menuItems: MenuItemDef[];
  renaming: boolean;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onOpenMenu: () => void;
  onOpen: () => void;
  onToggleSelect: () => void;
}) {
  const { glyph, tone, label } = KINDS[kindFor(entry.item)];
  const isFolder = entry.kind === "folder";
  const meta = isFolder
    ? `${label} · ${entry.item.childCount} ${entry.item.childCount === 1 ? "item" : "items"}`
    : `${label} · ${formatBytes(entry.item.size)}`;
  return (
    // biome-ignore lint/a11y/useSemanticElements: contains nested interactive menu, button nesting is invalid HTML
    <div
      role="button"
      tabIndex={0}
      className="grid w-full grid-cols-[20px_24px_1fr_auto_32px] items-center gap-3 border-b border-[#eff0f3] px-4 py-2 last:border-b-0 hover:bg-[#fafaff] sm:px-5"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLInputElement) return;
        if (event.key === "Enter" || event.key === " ") onOpen();
      }}
    >
      <input
        type="checkbox"
        aria-label={`Select ${entry.item.name}`}
        checked={selected}
        onChange={onToggleSelect}
        onClick={(event) => event.stopPropagation()}
        className="size-3.5 accent-[#5b64d6]"
      />
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-lg",
          TONES[tone],
        )}
      >
        <FileGlyph variant={glyph} className="size-4" />
      </span>
      <span className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="min-w-0">
          {renaming ? (
            <RenameInput
              value={renameValue}
              onChange={onRenameChange}
              onCommit={onRenameCommit}
              onCancel={onRenameCancel}
            />
          ) : (
            <span className="block truncate text-[13px] font-semibold text-[#414a5d]">
              {entry.item.name}
            </span>
          )}
          <span className="mt-0.5 block text-[11px] text-[#a0a6b2] sm:hidden">
            {meta}
          </span>
        </span>
      </span>
      {entry.kind === "file" ? (
        <span className="truncate text-[12px] text-[#8f97a6]">
          {formatBytes(entry.item.size)} · {timeAgo(entry.item.createdAt)}
        </span>
      ) : (
        <span className="truncate text-[12px] text-[#8f97a6]">
          {entry.item.childCount}{" "}
          {entry.item.childCount === 1 ? "item" : "items"}
        </span>
      )}
      {(!preview || entry.kind === "file") && (
        <FileMenu open={menuOpen} items={menuItems} onToggle={onOpenMenu} />
      )}
    </div>
  );
}

function GridCard({
  entry,
  preview,
  selected,
  menuOpen,
  menuItems,
  renaming,
  renameValue,
  onRenameChange,
  onRenameCommit,
  onRenameCancel,
  onOpenMenu,
  onOpen,
  onToggleSelect,
}: {
  entry: Entry;
  preview: boolean;
  selected: boolean;
  menuOpen: boolean;
  menuItems: MenuItemDef[];
  renaming: boolean;
  renameValue: string;
  onRenameChange: (value: string) => void;
  onRenameCommit: () => void;
  onRenameCancel: () => void;
  onOpenMenu: () => void;
  onOpen: () => void;
  onToggleSelect: () => void;
}) {
  const { glyph } = KINDS[kindFor(entry.item)];
  const isFolder = entry.kind === "folder";
  const isImage = !isFolder && entry.item.mimeType.startsWith("image/");
  return (
    // biome-ignore lint/a11y/useSemanticElements: contains nested interactive menu, button nesting is invalid HTML
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center gap-1.5 rounded-lg px-2 pb-2 pt-3 transition-colors",
        selected ? "bg-[#eef0ff]" : "hover:bg-[#f5f7ff]",
      )}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLInputElement) return;
        if (event.key === "Enter" || event.key === " ") onOpen();
      }}
    >
      <span
        className={cn(
          "absolute left-1 top-1 rounded-md bg-white shadow-sm transition-opacity",
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <input
          type="checkbox"
          aria-label={`Select ${entry.item.name}`}
          checked={selected}
          onChange={onToggleSelect}
          onClick={(event) => event.stopPropagation()}
          className="m-1 size-3.5 accent-[#5b64d6]"
        />
      </span>
      <span className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {(!preview || entry.kind === "file") && (
          <FileMenu open={menuOpen} items={menuItems} onToggle={onOpenMenu} />
        )}
      </span>
      <span className="flex h-16 w-full items-center justify-center overflow-hidden">
        {isImage ? (
          <span className="relative h-16 w-full overflow-hidden rounded-lg bg-[#f5f6f9]">
            <Image
              src={entry.item.url}
              alt={entry.item.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 25vw, 12vw"
              className="object-cover"
            />
          </span>
        ) : (
          <FileGlyph variant={glyph} className="size-12" />
        )}
      </span>
      {renaming ? (
        <RenameInput
          value={renameValue}
          onChange={onRenameChange}
          onCommit={onRenameCommit}
          onCancel={onRenameCancel}
        />
      ) : (
        <span className="w-full truncate text-center text-[12px] font-medium text-[#414a5d]">
          {entry.item.name}
        </span>
      )}
    </div>
  );
}

const RenameInput = ({
  value,
  onChange,
  onCommit,
  onCancel,
  ref,
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
  ref?: React.Ref<HTMLInputElement>;
}) => {
  return (
    <input
      ref={ref}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit();
        if (event.key === "Escape") onCancel();
      }}
      onBlur={onCommit}
      aria-label="Rename"
      className="w-full max-w-52 rounded-md border border-[#5b64d6] bg-white px-1.5 py-0.5 text-[13px] font-semibold text-[#414a5d] outline-none ring-3 ring-[#5b64d6]/10"
    />
  );
};

export { FilesView };

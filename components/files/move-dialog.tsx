"use client";

import { Check, Database, Folder } from "pixelarticons/react";
import { useEffect, useMemo, useState } from "react";
import type { FolderItem } from "@/lib/file-types";
import { cn } from "@/lib/utils";

export type MoveTarget = {
  kind: "file" | "folder";
  id: string;
  name: string;
};

type TreeNode = { folder: FolderItem; depth: number };

function MoveDialog({
  target,
  allFolders,
  onClose,
  onMove,
}: {
  target: MoveTarget;
  allFolders: FolderItem[];
  onClose: () => void;
  onMove: (folderId: string | null) => Promise<void>;
}) {
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, FolderItem[]>();
    for (const item of allFolders) {
      const list = map.get(item.parentId) ?? [];
      list.push(item);
      map.set(item.parentId, list);
    }
    return map;
  }, [allFolders]);

  const disabledIds = useMemo(() => {
    if (target.kind === "file") {
      return new Set<string>();
    }
    const disabled = new Set<string>([target.id]);
    const queue = [target.id];
    while (queue.length > 0) {
      const parentId = queue.shift();
      if (!parentId) continue;
      for (const child of childrenByParent.get(parentId) ?? []) {
        disabled.add(child.id);
        queue.push(child.id);
      }
    }
    return disabled;
  }, [childrenByParent, target]);

  const tree = useMemo(() => {
    const nodes: TreeNode[] = [];
    const walk = (parentId: string | null, depth: number) => {
      for (const item of childrenByParent.get(parentId) ?? []) {
        nodes.push({ folder: item, depth });
        walk(item.id, depth + 1);
      }
    };
    walk(null, 0);
    return nodes;
  }, [childrenByParent]);

  async function moveTo(folderId: string | null) {
    if (moving) return;
    setMoving(true);
    setError(null);
    try {
      await onMove(folderId);
      onClose();
    } catch {
      setError("Could not move — destination is invalid.");
    } finally {
      setMoving(false);
    }
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close move dialog"
        className="absolute inset-0 cursor-default bg-[#20293c]/20"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Move ${target.name}`}
        className="absolute left-1/2 top-1/2 flex max-h-[70vh] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-[#e3e5ea] bg-white p-5 shadow-[0_20px_50px_rgba(35,43,66,0.2)]"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#a1a8b5]">
          Move to…
        </p>
        <p className="mt-1 truncate text-[14px] font-semibold text-[#30394c]">
          {target.name}
        </p>
        <div className="mt-4 flex-1 space-y-0.5 overflow-y-auto pr-1">
          <MoveRow
            icon={Database}
            label="All files"
            depth={0}
            disabled={false}
            onClick={() => moveTo(null)}
          />
          {tree.map(({ folder: item, depth }) => {
            const isDisabled = disabledIds.has(item.id);
            return (
              <MoveRow
                key={item.id}
                icon={Folder}
                label={item.name}
                depth={depth + 1}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) moveTo(item.id);
                }}
              />
            );
          })}
        </div>
        {error && <p className="mt-3 text-[12px] text-[#c04a5d]">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-[12px] font-semibold text-[#596275] transition-colors hover:bg-[#f4f5f8]"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={moving}
            className="rounded-lg bg-[#5b64d6] px-3 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-[#4e57c5] disabled:opacity-60"
            onClick={() => moveTo(null)}
          >
            Move to All files
          </button>
        </div>
      </div>
    </div>
  );
}

function MoveRow({
  icon: Icon,
  label,
  depth,
  disabled,
  onClick,
}: {
  icon: typeof Folder;
  label: string;
  depth: number;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[12px] transition-colors",
        disabled
          ? "cursor-not-allowed text-[#c4c9d4]"
          : "text-[#596275] hover:bg-[#f4f5f8]",
      )}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      <Icon className="size-4 shrink-0 text-[#8b94a5]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {disabled && <Check className="size-3.5 shrink-0 text-[#c4c9d4]" />}
    </button>
  );
}

export { MoveDialog };

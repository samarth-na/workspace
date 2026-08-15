"use client";

import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type MenuItemDef = {
  icon: typeof MoreHorizontal;
  label: string;
  danger?: boolean;
  onSelect: () => void;
};

function FileMenu({
  open,
  items,
  onToggle,
}: {
  open: boolean;
  items: MenuItemDef[];
  onToggle: () => void;
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
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] hover:bg-[#f4f5f8]",
                  item.danger
                    ? "text-[#c04a5d] hover:bg-[#fdf0f2]"
                    : "text-[#596275]",
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggle();
                  item.onSelect();
                }}
              >
                <item.icon className="size-4" strokeWidth={1.8} />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}

export { FileMenu };

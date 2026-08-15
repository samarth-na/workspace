"use client";

import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import type { FileItem } from "@/lib/file-types";

function PreviewDialog({
  images,
  initialId,
  onClose,
}: {
  images: FileItem[];
  initialId: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      images.findIndex((image) => image.id === initialId),
    ),
  );
  const image = images[index];

  const step = useCallback(
    (delta: number) => {
      setIndex((prev) => {
        const next = prev + delta;
        if (next < 0) return images.length - 1;
        if (next >= images.length) return 0;
        return next;
      });
    },
    [images.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, step]);

  if (!image) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close preview"
        className="absolute inset-0 cursor-default bg-[#141827]/80"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Preview ${image.name}`}
        className="absolute inset-0 flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-3">
          <p className="min-w-0 truncate text-[13px] font-semibold text-white/90">
            {image.name}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={image.url}
              download={image.name}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/20"
            >
              <Download className="size-3.5" />
              Download
            </a>
            <button
              type="button"
              aria-label="Close preview"
              className="rounded-lg p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              onClick={onClose}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-10 sm:px-14">
          <div className="relative h-full max-h-[calc(100vh-140px)] w-full max-w-4xl">
            <Image
              src={image.url}
              alt={image.name}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={() => step(-1)}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
                onClick={() => step(1)}
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 py-3 text-[12px] text-white/60">
          {images.length > 1 ? (
            <span>
              {index + 1} / {images.length}
            </span>
          ) : (
            <span>{image.uploaderName}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export { PreviewDialog };

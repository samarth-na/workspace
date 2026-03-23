/**
 * GalleryView - Main gallery interface
 */
"use client"

import { useState } from "react"
import { Upload, ImageIcon, Grid3X3, LayoutList } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ImageCard } from "./image-card"
import type { GalleryImage } from "./types"

interface GalleryViewProps {
  images: GalleryImage[]
  onUpload: () => void
  onImageClick: (image: GalleryImage) => void
}

export function GalleryView({ images, onUpload, onImageClick }: GalleryViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className="flex h-full flex-col">
      {/* Gallery Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="size-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Gallery</h2>
          <span className="text-sm text-muted-foreground">
            {images.length} images
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "h-7 w-7",
                viewMode === "grid" && "bg-muted"
              )}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                "h-7 w-7",
                viewMode === "list" && "bg-muted"
              )}
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="size-4" />
            </Button>
          </div>
          <Button onClick={onUpload} size="sm">
            <Upload className="mr-2 size-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ImageIcon className="size-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">
                No images yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your first image to get started
              </p>
              <Button className="mt-4" onClick={onUpload}>
                <Upload className="mr-2 size-4" />
                Upload Image
              </Button>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  : "grid-cols-1"
              )}
            >
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onClick={() => onImageClick(image)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

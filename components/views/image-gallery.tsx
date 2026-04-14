"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageCard } from "@/components/shared/image-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchBar } from "@/components/shared/search-bar";
import { getGalleryImages } from "@/lib/data";
import { Upload, LayoutGrid, Rows3, SlidersHorizontal, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  onUpload?: () => void;
}

export function ImageGallery({ onUpload }: ImageGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const images = getGalleryImages();

  const filteredImages = images.filter(
    (img) =>
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeImageIndex = activeImageId
    ? filteredImages.findIndex((img) => img.id === activeImageId)
    : -1;
  const activeImage = activeImageIndex >= 0 ? filteredImages[activeImageIndex] : null;

  const goToPrevImage = () => {
    if (activeImageIndex < 0 || filteredImages.length === 0) return;
    const prevIndex = (activeImageIndex - 1 + filteredImages.length) % filteredImages.length;
    setActiveImageId(filteredImages[prevIndex].id);
  };

  const goToNextImage = () => {
    if (activeImageIndex < 0 || filteredImages.length === 0) return;
    const nextIndex = (activeImageIndex + 1) % filteredImages.length;
    setActiveImageId(filteredImages[nextIndex].id);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <ImageIcon className="h-4 w-4 text-primary" strokeWidth={2} />
          <h1 className="text-lg font-semibold text-foreground tracking-tight">Gallery</h1>
          <span className="text-sm text-muted-foreground font-medium">
            {filteredImages.length} images
          </span>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={onUpload}
          className="gap-2"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <SearchBar
          placeholder="Search images..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-xs"
        />

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-8 w-8 rounded-sm",
              viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn(
              "h-8 w-8 rounded-sm",
              viewMode === "list" ? "bg-muted text-foreground" : "text-muted-foreground"
            )}
          >
            <Rows3 className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <div className="mx-2 h-4 w-px bg-border" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Gallery Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredImages.length === 0 ? (
            <EmptyState
              type="gallery"
              title="No images found"
              description={searchQuery ? "Try a different search term" : "Upload your first image"}
              action={{
                label: "Upload Image",
                onClick: onUpload || (() => {}),
              }}
            />
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-x-5 gap-y-6 p-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  : "space-y-2"
              }
            >
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className={viewMode === "list" ? "rounded-sm border border-border bg-muted/20 p-2" : ""}
                >
                  <ImageCard
                    image={image}
                    aspectRatio="landscape"
                    onClick={() => setActiveImageId(image.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={activeImageId !== null} onOpenChange={(isOpen) => !isOpen && setActiveImageId(null)}>
        <DialogContent className="max-w-[min(1200px,92vw)] border-border/70 bg-background/95 p-0">
          {activeImage && (
            <div className="relative">
              <div className="flex min-h-[68vh] items-center justify-center p-8">
                <img
                  src={activeImage.url}
                  alt={activeImage.title}
                  className="max-h-[72vh] w-auto max-w-[80vw] rounded-sm object-contain"
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={goToPrevImage}
                className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/80 text-foreground hover:bg-background"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={goToNextImage}
                className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full border border-border/60 bg-background/80 text-foreground hover:bg-background"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>

              <div className="border-t border-border/60 px-5 py-3">
                <p className="truncate text-[13px] font-medium text-foreground">{activeImage.url.split("/").pop()}</p>
                <p className="text-[11px] text-muted-foreground">{activeImageIndex + 1} of {filteredImages.length}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

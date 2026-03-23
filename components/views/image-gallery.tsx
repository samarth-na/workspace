"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageCard } from "@/components/shared/image-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchBar } from "@/components/shared/search-bar";
import { getGalleryImages } from "@/lib/data";
import { Upload, Grid, List, Filter } from "lucide-react";

interface ImageGalleryProps {
  onUpload?: () => void;
}

export function ImageGallery({ onUpload }: ImageGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "masonry">("masonry");
  const images = getGalleryImages();

  const filteredImages = images.filter(
    (img) =>
      img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <h1 className="text-lg font-semibold text-foreground">Image Gallery</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onUpload}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <SearchBar
          placeholder="Search images..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("masonry")}
            className={viewMode === "masonry" ? "bg-accent" : ""}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-accent" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
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
                viewMode === "masonry"
                  ? "columns-2 gap-4 space-y-4 md:columns-3 lg:columns-4"
                  : "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
              }
            >
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className={viewMode === "masonry" ? "break-inside-avoid" : ""}
                >
                  <ImageCard
                    image={image}
                    onClick={() => console.log("Image clicked:", image.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

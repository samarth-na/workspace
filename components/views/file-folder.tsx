"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileCard } from "@/components/shared/file-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchBar } from "@/components/shared/search-bar";
import { getFiles, getFolders } from "@/lib/data";
import { Upload, Grid, List, Folder, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileFolderProps {
  onUpload?: () => void;
}

export function FileFolder({ onUpload }: FileFolderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  
  const files = getFiles();
  const folders = getFolders();

  const filteredFiles = files.filter(
    (file) =>
      file.folder === currentFolder &&
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentFolderData = currentFolder
    ? folders.find((f) => f.id === currentFolder)
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-foreground">Files</h1>
          
          {/* Breadcrumb */}
          {currentFolder && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronRight className="h-4 w-4" />
              <span>{currentFolderData?.name}</span>
            </div>
          )}
        </div>
        
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

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <SearchBar
          placeholder="Search files..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-accent" : ""}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={viewMode === "list" ? "bg-accent" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Files Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Folders */}
          {!currentFolder && folders.length > 0 && (
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Folders
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {folders.map((folder) => (
                  <button
                    type="button"
                    key={folder.id}
                    onClick={() => setCurrentFolder(folder.id)}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent"
                  >
                    <Folder className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">
                        {folder.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {folder.itemCount} items
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Back button when in folder */}
          {currentFolder && (
            <button
              type="button"
              onClick={() => setCurrentFolder(null)}
              className="mb-4 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to all files
            </button>
          )}

          {/* Files */}
          {filteredFiles.length === 0 ? (
            <EmptyState
              type="files"
              title="No files found"
              description={searchQuery ? "Try a different search term" : "Upload your first file"}
              action={{
                label: "Upload File",
                onClick: onUpload || (() => {}),
              }}
            />
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  : "space-y-2"
              )}
            >
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  viewMode={viewMode}
                  onClick={() => console.log("File clicked:", file.id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

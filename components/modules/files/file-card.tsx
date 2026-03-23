/**
 * FileCard - File display component
 */
"use client"

import { format } from "date-fns"
import { FileText, Image, Video, Music, File, MoreVertical, Download, Trash2, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { FileItem } from "./types"
import { formatFileSize, getFileIcon } from "./types"

interface FileCardProps {
  file: FileItem
  viewMode: "grid" | "list"
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  word: FileText,
  excel: FileText,
  presentation: FileText,
  file: File,
}

export function FileCard({ file, viewMode }: FileCardProps) {
  const iconType = getFileIcon(file.type)
  const Icon = iconMap[iconType] || File

  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-3 hover:bg-muted/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • {format(file.uploadedAt, "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={file.uploadedBy.avatar} />
            <AvatarFallback className="text-[10px]">
              {file.uploadedBy.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="mr-2 size-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit3 className="mr-2 size-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 hover:bg-muted/50">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-8 text-muted-foreground" />
        </div>
        <p className="mt-3 truncate text-sm font-medium text-foreground w-full">
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Download className="mr-2 size-4" />
            Download
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Edit3 className="mr-2 size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">
            <Trash2 className="mr-2 size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

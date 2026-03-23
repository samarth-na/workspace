import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { FileItem } from "@/lib/types";
import { getUserById } from "@/lib/data";
import { formatFileSize } from "@/lib/data/mock-files";
import { 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Presentation,
  FileCode, 
  FileArchive, 
  Film, 
  Music,
  File 
} from "lucide-react";

interface FileCardProps {
  file: FileItem;
  viewMode: "grid" | "list";
  onClick?: () => void;
}

const fileTypeIcons: Record<string, typeof File> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  ppt: Presentation,
  pptx: Presentation,
  image: ImageIcon,
  video: Film,
  audio: Music,
  zip: FileArchive,
  code: FileCode,
  other: File,
};

export function FileCard({ file, viewMode, onClick }: FileCardProps) {
  const uploader = getUserById(file.uploadedBy);
  const Icon = fileTypeIcons[file.type] || File;
  
  if (viewMode === "list") {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-4 rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent"
      >
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0 text-left">
          <h4 className="truncate text-sm font-medium text-foreground">
            {file.name}
          </h4>
          <p className="text-xs text-muted-foreground">
            {uploader?.name} • {formatFileSize(file.size)}
          </p>
        </div>
        
        <span className="flex-shrink-0 text-xs text-muted-foreground">
          {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
        </span>
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      className="flex flex-col gap-3 rounded-lg border border-border/50 p-4 transition-colors hover:bg-accent"
    >
      {/* Preview or Icon */}
      {file.thumbnailUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <img
            src={file.thumbnailUrl}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      
      {/* Info */}
      <div className="space-y-1">
        <h4 className="truncate text-sm font-medium text-foreground">
          {file.name}
        </h4>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)} • {formatDistanceToNow(file.uploadedAt, { addSuffix: true })}
        </p>
      </div>
    </button>
  );
}

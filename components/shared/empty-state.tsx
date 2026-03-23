import { cn } from "@/lib/utils";
import { ImageIcon, MessageSquare, FolderOpen } from "lucide-react";

interface EmptyStateProps {
  type: "chat" | "gallery" | "files" | "search";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const defaultContent: Record<string, { title: string; description: string; icon: typeof ImageIcon }> = {
  chat: {
    title: "No messages yet",
    description: "Start a conversation to see messages here",
    icon: MessageSquare,
  },
  gallery: {
    title: "No images yet",
    description: "Upload your first image to get started",
    icon: ImageIcon,
  },
  files: {
    title: "No files yet",
    description: "Upload files to see them here",
    icon: FolderOpen,
  },
  search: {
    title: "No results found",
    description: "Try adjusting your search terms",
    icon: MessageSquare,
  },
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const content = defaultContent[type];
  const Icon = content.icon;
  
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-medium text-foreground">
        {title || content.title}
      </h3>
      
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {description || content.description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

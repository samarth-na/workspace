import { ImageIcon, MessageSquare, FolderOpen, Search, Plus } from "lucide-react";

interface EmptyStateProps {
  type: "chat" | "gallery" | "files" | "search";
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const defaultContent: Record<string, { title: string; description: string; icon: typeof ImageIcon; hint?: string }> = {
  chat: {
    title: "Start a conversation",
    description: "Select an existing chat or create a new one to begin messaging",
    icon: MessageSquare,
    hint: "Press ⌘+N to create new conversation",
  },
  gallery: {
    title: "Your gallery is empty",
    description: "Upload images to organize and share with your team",
    icon: ImageIcon,
    hint: "Drag and drop images anywhere to upload",
  },
  files: {
    title: "No files yet",
    description: "Upload documents, spreadsheets, and other files to collaborate",
    icon: FolderOpen,
    hint: "Create folders to organize your workspace",
  },
  search: {
    title: "No matches found",
    description: "Try broadening your search or check for typos",
    icon: Search,
    hint: "Use filters to narrow results",
  },
};

export function EmptyState({ type, title, description, action }: EmptyStateProps) {
  const content = defaultContent[type];
  const Icon = content.icon;

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {/* Geometric mark instead of circle */}
      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-sm bg-muted ring-1 ring-border">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>

      {/* Large display text */}
      <h3 className="text-2xl font-semibold text-foreground tracking-tight">
        {title || content.title}
      </h3>

      <p className="mt-3 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description || content.description}
      </p>

      {/* Teach hint */}
      {content.hint && (
        <p className="mt-4 text-xs text-muted-foreground/60 font-medium">
          {content.hint}
        </p>
      )}

      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-6 inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          {action.label}
        </button>
      )}
    </div>
  );
}

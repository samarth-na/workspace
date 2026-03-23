import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { GalleryImage } from "@/lib/types";
import { getUserById } from "@/lib/data";
import { ImageIcon } from "lucide-react";

interface ImageCardProps {
  image: GalleryImage;
  onClick?: () => void;
  aspectRatio?: "square" | "portrait" | "landscape" | "auto";
}

export function ImageCard({ image, onClick, aspectRatio = "auto" }: ImageCardProps) {
  const uploader = getUserById(image.uploadedBy);
  
  const aspectClasses = {
    square: "aspect-square",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: "",
  };
  
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border border-border/50 bg-muted transition-all hover:border-border-strong"
    >
      {/* Image */}
      <div className={cn("relative w-full overflow-hidden", aspectClasses[aspectRatio])}>
        <img
          src={image.url}
          alt={image.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        
        {/* Info overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full p-3 transition-transform duration-200 group-hover:translate-y-0">
          <h4 className="truncate text-sm font-medium text-white">
            {image.title}
          </h4>
          
          <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
            <span>{uploader?.name}</span>
            <span>•</span>
            <span>{formatDistanceToNow(image.uploadedAt, { addSuffix: true })}</span>
          </div>
          
          {image.tags && image.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {image.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

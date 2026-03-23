/**
 * ImageCard - Gallery image display
 */
"use client"

import { useState } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { GalleryImage } from "./types"

interface ImageCardProps {
  image: GalleryImage
  onClick?: () => void
}

export function ImageCard({ image, onClick }: ImageCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-card cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden">
        {!isLoaded && (
          <div className="aspect-square bg-muted animate-pulse" />
        )}
        <img
          src={image.url}
          alt={image.title || "Gallery image"}
          className={cn(
            "h-full w-full object-cover transition-transform duration-300 group-hover:scale-105",
            !isLoaded && "opacity-0"
          )}
          onLoad={() => setIsLoaded(true)}
        />
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {image.title && (
            <p className="text-sm font-medium text-white truncate">
              {image.title}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={image.uploadedBy.avatar} />
                <AvatarFallback className="bg-white/20 text-white text-[10px]">
                  {image.uploadedBy.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-white/80">
                {image.uploadedBy.name}
              </span>
            </div>
            <span className="text-xs text-white/60">
              {format(image.uploadedAt, "MMM d")}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

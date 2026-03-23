/**
 * PresenceAvatars - Show active collaborators
 */
"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface User {
  id: string
  name: string
  avatar?: string
  color: string
}

interface PresenceAvatarsProps {
  users: User[]
  maxShown?: number
}

export function PresenceAvatars({ users, maxShown = 4 }: PresenceAvatarsProps) {
  const shown = users.slice(0, maxShown)
  const remaining = users.length - maxShown

  return (
    <div className="flex -space-x-2">
      {shown.map((user) => (
        <div
          key={user.id}
          className="relative"
          style={{ zIndex: shown.indexOf(user) }}
        >
          <Avatar className="h-7 w-7 ring-2 ring-background">
            <AvatarImage src={user.avatar} />
            <AvatarFallback
              className="text-[10px] text-white"
              style={{ backgroundColor: user.color }}
            >
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {/* Cursor indicator */}
          <div
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-background"
            style={{ backgroundColor: user.color }}
          />
        </div>
      ))}
      {remaining > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
          +{remaining}
        </div>
      )}
    </div>
  )
}

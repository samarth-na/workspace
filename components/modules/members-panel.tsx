/**
 * MembersPanel - Display workspace members
 */
"use client"

import { Crown, MoreVertical, UserX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Member {
  id: string
  name: string
  email: string
  avatar?: string
  role: "admin" | "member"
  isOnline?: boolean
}

interface MembersPanelProps {
  members: Member[]
  currentUserId: string
  onRemoveMember: (memberId: string) => void
}

export function MembersPanel({ members, currentUserId, onRemoveMember }: MembersPanelProps) {
  const currentUser = members.find((m) => m.id === currentUserId)
  const isAdmin = currentUser?.role === "admin"

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xs">
                  {member.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {member.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-card" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {member.name}
                </span>
                {member.id === currentUserId && (
                  <span className="text-xs text-muted-foreground">(You)</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {member.role === "admin" ? (
              <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                <Crown className="size-3" />
                Admin
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Member</span>
            )}

            {isAdmin && member.id !== currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onRemoveMember(member.id)}
                  >
                    <UserX className="mr-2 size-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

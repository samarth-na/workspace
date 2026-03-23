/**
 * NotesEditor - Collaborative note editor
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { Check, Cloud, CloudOff, MoreHorizontal, Share2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PresenceAvatars } from "./presence-avatars"

interface User {
  id: string
  name: string
  avatar?: string
  color: string
}

interface Note {
  id: string
  title: string
  content: string
  updatedAt: Date
}

interface NotesEditorProps {
  note: Note
  collaborators: User[]
  currentUserId: string
  onSave: (note: Partial<Note>) => void
  isSaving?: boolean
  isConnected?: boolean
}

export function NotesEditor({
  note,
  collaborators,
  onSave,
  isSaving = false,
  isConnected = true,
}: NotesEditorProps) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [lastSaved, setLastSaved] = useState<Date>(note.updatedAt)

  // Auto-save on changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== note.title || content !== note.content) {
        onSave({ title, content })
        setLastSaved(new Date())
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [title, content, note.title, note.content, onSave])

  return (
    <div className="flex h-full flex-col">
      {/* Editor Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-4 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-8 border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground"
            placeholder="Untitled Note"
          />
        </div>
        <div className="flex items-center gap-3">
          <PresenceAvatars users={collaborators} />
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {isConnected ? (
              <>
                <Cloud className="size-3" />
                {isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <span>Saved</span>
                )}
              </>
            ) : (
              <>
                <CloudOff className="size-3" />
                <span>Offline</span>
              </>
            )}
          </div>
          <Button variant="ghost" size="icon-sm">
            <Share2 className="size-4" />
          </Button>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <ScrollArea className="flex-1">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[500px] border-0 bg-transparent px-0 text-base leading-relaxed focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
            placeholder="Start typing..."
          />
        </div>
      </ScrollArea>
    </div>
  )
}

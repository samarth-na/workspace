/**
 * MessageInput - Chat input with auto-expand
 */
"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface MessageInputProps {
  onSend: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export function MessageInput({
  onSend,
  placeholder = "Write a message...",
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  const handleSubmit = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim())
      setContent("")
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-background p-4">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        disabled={disabled}
      >
        <Paperclip className="size-5" />
      </Button>

      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[40px] max-h-[200px]"
          )}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!content.trim() || disabled}
        size="icon"
        className="shrink-0"
      >
        <Send className="size-4" />
      </Button>
    </div>
  )
}

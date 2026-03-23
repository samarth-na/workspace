/**
 * InviteModal - Invite members to workspace
 */
"use client"

import { useState } from "react"
import { Mail, UserPlus, Shield, User } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Role = "admin" | "member"

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInvite: (email: string, role: Role) => void
}

export function InviteModal({ open, onOpenChange, onInvite }: InviteModalProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("member")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubmitting(true)
    await onInvite(email, role)
    setIsSubmitting(false)
    setEmail("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5" />
            Invite Members
          </DialogTitle>
          <DialogDescription>
            Invite team members to collaborate in this workspace.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRole("member")}
                className={`flex flex-1 items-center gap-2 rounded-md border p-3 text-left transition-colors ${
                  role === "member"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <User className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Member</p>
                  <p className="text-xs text-muted-foreground">Can view and edit</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex flex-1 items-center gap-2 rounded-md border p-3 text-left transition-colors ${
                  role === "admin"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Shield className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-muted-foreground">Full access</p>
                </div>
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!email || isSubmitting}>
              {isSubmitting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Message types and interfaces
 */
export interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: Date
  type: "user" | "system"
  edited?: boolean
}

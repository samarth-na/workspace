/**
 * Files module types
 */
export interface FileItem {
  id: string
  name: string
  type: string
  size: number
  uploadedBy: {
    id: string
    name: string
    avatar?: string
  }
  uploadedAt: Date
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

export function getFileIcon(type: string): string {
  if (type.startsWith("image/")) return "image"
  if (type.startsWith("video/")) return "video"
  if (type.startsWith("audio/")) return "audio"
  if (type.includes("pdf")) return "pdf"
  if (type.includes("word") || type.includes("document")) return "word"
  if (type.includes("excel") || type.includes("sheet")) return "excel"
  if (type.includes("powerpoint") || type.includes("presentation")) return "presentation"
  return "file"
}

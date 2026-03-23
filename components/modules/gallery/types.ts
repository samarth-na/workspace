/**
 * Gallery module components
 */
export interface GalleryImage {
  id: string
  url: string
  title?: string
  uploadedBy: {
    id: string
    name: string
    avatar?: string
  }
  uploadedAt: Date
  tags?: string[]
}

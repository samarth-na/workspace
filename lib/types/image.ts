export interface GalleryImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  title: string;
  description?: string;
  uploadedBy: string;
  uploadedAt: Date;
  dimensions?: {
    width: number;
    height: number;
  };
  tags?: string[];
}

export type FileType =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "ppt"
  | "pptx"
  | "image"
  | "video"
  | "audio"
  | "zip"
  | "code"
  | "other";

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  folder?: string;
  thumbnailUrl?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  itemCount: number;
}

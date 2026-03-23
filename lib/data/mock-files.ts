import type { FileItem, Folder } from "@/lib/types/file";

export const mockFolders: Folder[] = [
  {
    id: "folder-1",
    name: "Documents",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    itemCount: 5,
  },
  {
    id: "folder-2",
    name: "Designs",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
    itemCount: 8,
  },
  {
    id: "folder-3",
    name: "Project Files",
    parentId: "folder-1",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
    itemCount: 3,
  },
];

export const mockFiles: FileItem[] = [
  {
    id: "file-1",
    name: "Project_Requirements.pdf",
    type: "pdf",
    mimeType: "application/pdf",
    size: 2457600,
    url: "#",
    uploadedBy: "user-1",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    folder: "folder-1",
  },
  {
    id: "file-2",
    name: "Design_System.fig",
    type: "other",
    mimeType: "application/figma",
    size: 15240000,
    url: "#",
    uploadedBy: "user-2",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    folder: "folder-2",
  },
  {
    id: "file-3",
    name: "Meeting_Notes.docx",
    type: "docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 45056,
    url: "#",
    uploadedBy: "user-3",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    folder: "folder-1",
  },
  {
    id: "file-4",
    name: "Budget_2024.xlsx",
    type: "xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 125000,
    url: "#",
    uploadedBy: "user-4",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    folder: "folder-1",
  },
  {
    id: "file-5",
    name: "Presentation.pptx",
    type: "pptx",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size: 5242880,
    url: "#",
    uploadedBy: "user-5",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
  },
  {
    id: "file-6",
    name: "Logo_Final.png",
    type: "image",
    mimeType: "image/png",
    size: 102400,
    url: "/scenarys/Default.jpg",
    uploadedBy: "user-6",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    folder: "folder-2",
    thumbnailUrl: "/scenarys/Default.jpg",
  },
  {
    id: "file-7",
    name: "main.tsx",
    type: "code",
    mimeType: "text/typescript",
    size: 5120,
    url: "#",
    uploadedBy: "user-7",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
  },
  {
    id: "file-8",
    name: "Archive.zip",
    type: "zip",
    mimeType: "application/zip",
    size: 104857600,
    url: "#",
    uploadedBy: "user-8",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
  },
  {
    id: "file-9",
    name: "Product_Demo.mp4",
    type: "video",
    mimeType: "video/mp4",
    size: 52428800,
    url: "#",
    uploadedBy: "user-1",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
  },
  {
    id: "file-10",
    name: "Team_Photo.jpg",
    type: "image",
    mimeType: "image/jpeg",
    size: 3145728,
    url: "/scenarys/hert-niks-ZdmFXbTkiOk-unsplash.jpg",
    uploadedBy: "user-2",
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
    thumbnailUrl: "/scenarys/hert-niks-ZdmFXbTkiOk-unsplash.jpg",
  },
];

export const getFiles = (): FileItem[] => mockFiles;
export const getFolders = (): Folder[] => mockFolders;
export const getFilesByFolder = (folderId?: string): FileItem[] => {
  if (!folderId) return mockFiles.filter((f) => !f.folder);
  return mockFiles.filter((f) => f.folder === folderId);
};
export const getFileById = (id: string): FileItem | undefined => {
  return mockFiles.find((f) => f.id === id);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

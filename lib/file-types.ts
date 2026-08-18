export type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploaderName: string;
  createdAt: number;
};

export type FolderItem = {
  id: string;
  name: string;
  parentId: string | null;
  childCount: number;
  createdAt: number;
};

export type FolderPathItem = {
  id: string;
  name: string;
};

export type WorkspaceStorage = {
  used: number;
  limit: number;
};

export type FolderContentsResponse = {
  files: FileItem[];
  folders: FolderItem[];
  path: FolderPathItem[];
  isPreview: boolean;
  storage: WorkspaceStorage;
};

export type UploadFileResponse = {
  file: FileItem;
};

export type CreateFolderResponse = {
  folder: FolderItem;
};

export type DeleteFolderResponse = {
  ok: boolean;
};

export type UpdateFileResponse = {
  file: FileItem;
};

export type UpdateFolderResponse = {
  folder: FolderItem;
};

export type DeleteFileResponse = {
  ok: boolean;
};

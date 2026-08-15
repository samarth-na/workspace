export type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
  uploaderName: string;
  createdAt: number;
};

export type FilesResponse = {
  files: FileItem[];
  isPreview: boolean;
};

export type UploadFileResponse = {
  file: FileItem;
};

export type DeleteFileResponse = {
  ok: boolean;
};

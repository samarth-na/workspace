import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

import { getSessionUser } from "@/lib/chat-data";
import {
  fetchWorkspaceStorageUsed,
  WORKSPACE_STORAGE_LIMIT,
} from "@/lib/files-data";
import { getSessionWorkspace } from "@/lib/workspace-data";

const f = createUploadthing();

export const uploadRouter = {
  fileUploader: f(
    { blob: { maxFileSize: "32MB", maxFileCount: 1 } },
    { awaitServerData: false },
  )
    .middleware(async ({ files }) => {
      const self = await getSessionUser();
      if (!self) {
        throw new UploadThingError("You must be signed in to upload files");
      }
      const workspace = await getSessionWorkspace();
      if (!workspace) {
        throw new UploadThingError(
          "You must be in a workspace to upload files",
        );
      }
      const incomingSize = files.reduce((sum, file) => sum + file.size, 0);
      const used = await fetchWorkspaceStorageUsed(workspace.workspaceId);
      if (used + incomingSize > WORKSPACE_STORAGE_LIMIT) {
        throw new UploadThingError(
          "This upload would exceed the 100 MB workspace storage limit",
        );
      }
      return { userId: self.id, workspaceId: workspace.workspaceId };
    })
    .onUploadComplete(() => {}),

  imageUploader: f(
    { image: { maxFileSize: "8MB", maxFileCount: 1 } },
    { awaitServerData: false },
  )
    .middleware(async () => {
      const self = await getSessionUser();
      if (!self) {
        throw new UploadThingError("You must be signed in to upload images");
      }
      return { userId: self.id };
    })
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const utapi = new UTApi();

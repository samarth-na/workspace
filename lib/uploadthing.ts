import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

import { getSessionUser } from "@/lib/chat-data";
import { getSessionWorkspace } from "@/lib/workspace-data";

const f = createUploadthing();

export const uploadRouter = {
  fileUploader: f(
    { blob: { maxFileSize: "32MB", maxFileCount: 1 } },
    { awaitServerData: false },
  )
    .middleware(async () => {
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

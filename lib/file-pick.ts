let pendingPick = false;
let pendingFolder = false;

export function requestFilePick() {
  pendingPick = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("workspace:pick-files"));
  }
}

export function consumeFilePickRequest() {
  const wasPending = pendingPick;
  pendingPick = false;
  return wasPending;
}

export function requestNewFolder() {
  pendingFolder = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("workspace:new-folder"));
  }
}

export function consumeNewFolderRequest() {
  const wasPending = pendingFolder;
  pendingFolder = false;
  return wasPending;
}

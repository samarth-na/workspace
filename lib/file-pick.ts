let pendingPick = false;

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

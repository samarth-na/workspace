const LEGACY_STORED_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\./;

export function fileUrl(storedName: string): string {
  if (LEGACY_STORED_NAME.test(storedName)) {
    return `/uploads/${storedName}`;
  }
  return `https://utfs.io/f/${storedName}`;
}

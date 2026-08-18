export function isPublicPreviewEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_PUBLIC_PREVIEW === "true"
  );
}

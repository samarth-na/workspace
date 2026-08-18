function requiredPublicUrl(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required`);
  }
  try {
    const url = new URL(value);
    if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) {
      throw new Error("unsupported protocol");
    }
    if (
      process.env.NODE_ENV === "production" &&
      (url.protocol === "http:" || url.protocol === "ws:")
    ) {
      throw new Error("production client URLs must use HTTPS or WSS");
    }
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
  return value.replace(/\/$/, "");
}

export const realtimeUrl = requiredPublicUrl(
  process.env.NEXT_PUBLIC_REALTIME_URL,
  "NEXT_PUBLIC_REALTIME_URL",
);

export const chatWebSocketUrl = requiredPublicUrl(
  process.env.NEXT_PUBLIC_WS_URL,
  "NEXT_PUBLIC_WS_URL",
);

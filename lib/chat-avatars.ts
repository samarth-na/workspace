const AVATAR_PALETTE = [
  "#f5c7b8",
  "#c6d8f5",
  "#ddd0f3",
  "#d4e8cf",
  "#d9d6f4",
  "#cde3f0",
  "#f3d9e8",
  "#e8e0cf",
  "#cfe3d4",
];

const KNOWN_COLORS: Record<string, string> = {
  "samarth@cedar.co": "#d9d6f4",
  "maya@cedar.co": "#f5c7b8",
  "jordan@cedar.co": "#c6d8f5",
  "priya@cedar.co": "#ddd0f3",
  "alex@cedar.co": "#d4e8cf",
};

export function avatarColorFor(email: string, id: string): string {
  if (KNOWN_COLORS[email]) return KNOWN_COLORS[email];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

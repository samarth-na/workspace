const AVATAR_PALETTE = [
  "#f5c7b8",
  "#c6d8f5",
  "#e2e9f7",
  "#d4e8cf",
  "#c9d8f7",
  "#cde3f0",
  "#f3d9e8",
  "#e8e0cf",
  "#cfe3d4",
];

const KNOWN_COLORS: Record<string, string> = {
  "samarth@cloudworkspace.co": "#c9d8f7",
  "maya@cloudworkspace.co": "#f5c7b8",
  "jordan@cloudworkspace.co": "#c6d8f5",
  "priya@cloudworkspace.co": "#e2e9f7",
  "alex@cloudworkspace.co": "#d4e8cf",
};

export function avatarColorFor(email: string, id: string): string {
  if (KNOWN_COLORS[email]) return KNOWN_COLORS[email];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

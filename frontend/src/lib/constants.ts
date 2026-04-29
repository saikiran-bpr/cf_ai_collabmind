export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8787";

export const WS_URL = BACKEND_URL.replace(/^http/, "ws");

export const USER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
] as const;

export const DEBOUNCE_AI_MS = 2000;

export const MAX_CONTEXT_CHARS = 3000;

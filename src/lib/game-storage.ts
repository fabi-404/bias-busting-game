// Local storage helpers for anonymous host & player identity per session.

type Identity = { kind: "host" | "player"; token: string; playerId?: string; name: string };

const KEY = "rb_game_identity_v1";

type Store = Record<string, Identity>; // keyed by session code

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

function write(s: Store) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function setIdentity(code: string, id: Identity) {
  const s = read();
  s[code.toUpperCase()] = id;
  write(s);
}

export function getIdentity(code: string): Identity | null {
  return read()[code.toUpperCase()] ?? null;
}

export function clearIdentity(code: string) {
  const s = read();
  delete s[code.toUpperCase()];
  write(s);
}

export function generateCode(): string {
  // Avoid confusing chars (0/O, 1/I)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

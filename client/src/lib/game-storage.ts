type Identity = { kind: "host" | "player"; token: string; playerId?: string; name: string };

const KEY = "rb_game_identity_v1";
type Store = Record<string, Identity>;

function read(): Store {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}

function write(s: Store) {
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

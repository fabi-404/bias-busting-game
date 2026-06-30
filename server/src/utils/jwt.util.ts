import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev_secret_change_in_production";

export type JwtPayload = {
  sub: string;
  role: "host" | "player";
  sessionId: string;
  playerId?: string;
};

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET) as JwtPayload;
}

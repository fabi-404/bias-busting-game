import { io as ioClient } from "socket.io-client";

export const socket = ioClient(import.meta.env.VITE_API_URL ?? "/", {
  path: "/socket.io",
  autoConnect: false,
});

export function joinRoom(sessionId: string) {
  if (!socket.connected) socket.connect();
  socket.emit("join:room", sessionId);
}

export function leaveRoom(sessionId: string) {
  socket.emit("leave:room", sessionId);
}

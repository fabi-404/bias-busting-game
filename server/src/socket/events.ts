import type { Server } from "socket.io";

export function registerSocketEvents(io: Server) {
  io.on("connection", (socket) => {
    // Client tritt einem Spielraum bei (per Session-ID)
    socket.on("join:room", (sessionId: string) => {
      socket.join(sessionId);
    });

    socket.on("leave:room", (sessionId: string) => {
      socket.leave(sessionId);
    });

    socket.on("disconnect", () => {
      // cleanup handled automatically by socket.io
    });
  });
}

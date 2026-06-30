import { Server } from "socket.io";
import type http from "http";

export let io: Server;

export function initIO(httpServer: http.Server, corsOrigin: string): Server {
  io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    },
  });
  return io;
}

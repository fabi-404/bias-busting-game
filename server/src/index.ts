import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

import { sessionsRouter } from "./routes/sessions.js";
import { playersRouter } from "./routes/players.js";
import { gameRouter } from "./routes/game.js";
import { chatRouter } from "./routes/chat.js";
import { adminRouter } from "./routes/admin.js";
import { registerSocketEvents } from "./socket/events.js";

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  },
});

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json());

app.use("/api/sessions", sessionsRouter);
app.use("/api/sessions", playersRouter);
app.use("/api/sessions", gameRouter);
app.use("/api/sessions", chatRouter);
app.use("/api/cards", adminRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

registerSocketEvents(io);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message ?? err, err?.stack);
  res.status(500).json({ error: err?.message ?? "Internal Server Error" });
});

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

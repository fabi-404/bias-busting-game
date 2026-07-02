import express, { Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { StatusCodes } from "http-status-codes";
import cors from "cors";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

import { initIO } from "./src/configs/socket.config.js";
import { registerSocketEvents } from "./src/socket/events.js";
import { RouterUtil } from "./src/utils/router.util.js";
import { PostgreSQLConfig } from "./src/configs/postgreSQL.config.js";

export const app = express();
const httpServer = createServer(app);

const clientOrigin = (process.env.CLIENT_ORIGIN ?? "http://localhost:5173").trim();

const io = initIO(httpServer, clientOrigin);

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

RouterUtil.routes();

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: new Date().toISOString() });
});

registerSocketEvents(io);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err?.message ?? err, err?.stack);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err?.message ?? "Internal Server Error" });
});

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  PostgreSQLConfig.pool.connect()
    .then((client) => { client.release(); console.log("[DB] Connection OK"); })
    .catch((err) => console.error("[DB] Connection FAILED:", err));
});

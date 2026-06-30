import express from "express";
import { createServer } from "http";
import cors from "cors";

import { initIO } from "./src/configs/socket.config.js";
import { registerSocketEvents } from "./src/socket/events.js";
import { RouterUtil } from "./src/utils/router.util.js";

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
  res.status(500).json({ error: err?.message ?? "Internal Server Error" });
});

const PORT = Number(process.env.PORT ?? 3001);
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

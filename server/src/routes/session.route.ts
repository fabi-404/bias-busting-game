import { Request, Response } from "express";
import { io } from "../configs/socket.config.js";
import { SessionService } from "../services/session.service.js";
import type { CreateSessionBody } from "../types/game.type.js";

export class SessionRoute {
  static async create(req: Request<object, object, CreateSessionBody>, res: Response) {
    const { host_name } = req.body;
    if (!host_name?.trim()) {
      return res.status(400).json({ error: "host_name required" });
    }

    try {
      const session = await SessionService.create(req.body);
      return res.status(201).json(session);
    } catch {
      return res.status(500).json({ error: "Could not create session" });
    }
  }

  static async findByCode(req: Request<{ code: string }>, res: Response) {
    const state = await SessionService.findByCode(req.params.code);
    if (!state) return res.status(404).json({ error: "Session not found" });
    return res.json(state);
  }

  static async update(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const session = await SessionService.update(id, req.body);
    if (!session) return res.status(400).json({ error: "No valid fields" });

    io.to(id).emit("session:updated", session);
    return res.json(session);
  }
}

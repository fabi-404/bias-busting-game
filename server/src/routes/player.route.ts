import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { io } from "../configs/socket.config.js";
import { PlayerService } from "../services/player.service.js";
import type { JoinPlayerBody } from "../types/game.type.js";

export class PlayerRoute {
  static async join(req: Request<{ id: string }, object, JoinPlayerBody>, res: Response) {
    const { id } = req.params;
    if (!req.body.name?.trim()) return res.status(StatusCodes.BAD_REQUEST).json({ error: "name required" });

    try {
      const player = await PlayerService.join(id, req.body);
      const players = await PlayerService.listBySession(id);
      io.to(id).emit("players:updated", players);
      return res.status(StatusCodes.CREATED).json(player);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      return res.status(err.status ?? StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message ?? "Internal Server Error" });
    }
  }

  static async updateScore(
    req: Request<{ id: string; playerId: string }, object, { score: number }>,
    res: Response,
  ) {
    const { id, playerId } = req.params;
    const player = await PlayerService.updateScore(id, playerId, req.body.score);
    if (!player) return res.status(StatusCodes.NOT_FOUND).json({ error: "Player not found" });

    const players = await PlayerService.listBySession(id);
    io.to(id).emit("players:updated", players);
    return res.json(player);
  }
}

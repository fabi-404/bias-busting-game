import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { io } from "../configs/socket.config.js";
import { ChatService } from "../services/chat.service.js";
import type { PostChatBody } from "../types/game.type.js";

export class ChatRoute {
  static async list(req: Request<{ id: string }>, res: Response) {
    const messages = await ChatService.listBySession(req.params.id);
    return res.json(messages);
  }

  static async add(req: Request<{ id: string }, object, PostChatBody>, res: Response) {
    const { id } = req.params;
    if (!req.body.message?.trim()) return res.status(StatusCodes.BAD_REQUEST).json({ error: "message required" });

    const message = await ChatService.add(id, req.body);
    io.to(id).emit("chat:message", message);
    return res.status(StatusCodes.CREATED).json(message);
  }
}

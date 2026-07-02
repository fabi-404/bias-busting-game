import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AdminService } from "../services/admin.service.js";
import type { CardBody } from "../types/game.type.js";

export class AdminRoute {
  static async list(_req: Request, res: Response) {
    const cards = await AdminService.listAll();
    return res.json(cards);
  }

  static async create(req: Request<object, object, CardBody>, res: Response) {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "title and content required" });
    }

    const card = await AdminService.create(req.body);
    return res.status(StatusCodes.CREATED).json(card);
  }

  static async update(req: Request<{ id: string }, object, CardBody>, res: Response) {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "title and content required" });
    }

    const card = await AdminService.update(req.params.id, req.body);
    if (!card) return res.status(StatusCodes.NOT_FOUND).json({ error: "Card not found" });
    return res.json(card);
  }

  static async remove(req: Request<{ id: string }>, res: Response) {
    const deleted = await AdminService.remove(req.params.id);
    if (!deleted) return res.status(StatusCodes.NOT_FOUND).json({ error: "Card not found" });
    return res.json({ ok: true });
  }
}

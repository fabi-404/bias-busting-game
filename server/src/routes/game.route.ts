import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { io } from "../configs/socket.config.js";
import { GameService } from "../services/game.service.js";
import type {
  PostAnswerBody,
  PostAssignmentsBody,
  PostGuessBody,
  PostPrevoteBody,
  PostReadyBody,
  PostReflectionBody,
  PostVoteBody,
} from "../types/game.type.js";

export class GameRoute {
  static async assign(
    req: Request<{ id: string }, object, PostAssignmentsBody>,
    res: Response,
  ) {
    const { id } = req.params;
    if (!req.body.rows?.length) return res.status(StatusCodes.BAD_REQUEST).json({ error: "rows required" });

    const assignments = await GameService.assign(id, req.body);
    io.to(id).emit("assignments:updated", assignments);
    return res.json(assignments);
  }

  static async answer(
    req: Request<{ id: string }, object, PostAnswerBody>,
    res: Response,
  ) {
    const { id } = req.params;

    try {
      const { answer_row, players } = await GameService.answer(id, req.body);
      const allAnswers = await GameService.listAnswers(id);

      if (players.length) io.to(id).emit("players:updated", players);
      io.to(id).emit("answers:updated", allAnswers);
      return res.json(answer_row);
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      return res.status(err.status ?? StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message ?? "Internal Server Error" });
    }
  }

  static async vote(req: Request<{ id: string }, object, PostVoteBody>, res: Response) {
    const { id } = req.params;
    const votes = await GameService.vote(id, req.body);
    io.to(id).emit("votes:updated", votes);
    return res.json({ ok: true });
  }

  static async resolveRound(req: Request<{ id: string; round: string }>, res: Response) {
    const { id, round } = req.params;
    const roundNumber = Number(round);
    if (!Number.isInteger(roundNumber) || roundNumber < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "invalid round" });
    }

    const { correct_candidate_id, players } = await GameService.resolveRound(id, roundNumber);
    io.to(id).emit("players:updated", players);
    io.to(id).emit("round_resolved", { round_number: roundNumber, correct_candidate_id });
    return res.json({ correct_candidate_id, players });
  }

  static async prevote(req: Request<{ id: string }, object, PostPrevoteBody>, res: Response) {
    const { id } = req.params;
    const prevotes = await GameService.prevote(id, req.body);
    io.to(id).emit("prevotes:updated", prevotes);
    return res.json({ ok: true });
  }

  static async guess(req: Request<{ id: string }, object, PostGuessBody>, res: Response) {
    const { id } = req.params;
    if (!req.body.guesses?.length) return res.status(StatusCodes.BAD_REQUEST).json({ error: "guesses required" });

    const { guesses, correct, players } = await GameService.guess(id, req.body);
    if (players.length) io.to(id).emit("players:updated", players);
    io.to(id).emit("guesses:updated", guesses);
    return res.json({ ok: true, correct });
  }

  static async ready(req: Request<{ id: string }, object, PostReadyBody>, res: Response) {
    const { id } = req.params;
    const readyList = await GameService.ready(id, req.body);
    io.to(id).emit("ready:updated", readyList);
    return res.json({ ok: true });
  }

  static async saveReflection(
    req: Request<{ id: string }, object, PostReflectionBody>,
    res: Response,
  ) {
    const { id } = req.params;
    const entry = await GameService.saveReflection(id, req.body);
    return res.json(entry);
  }

  static async getReflection(
    req: Request<{ id: string; playerId: string }>,
    res: Response,
  ) {
    const { id, playerId } = req.params;
    const entry = await GameService.getReflection(id, playerId);
    return res.json(entry ?? null);
  }

  static async finalize(req: Request<{ id: string }>, res: Response) {
    const { id } = req.params;
    const { achievements, players } = await GameService.finalize(id);
    io.to(id).emit("players:updated", players);
    io.to(id).emit("achievements:updated", achievements);
    return res.json(achievements);
  }
}

import { Router, Request, Response, NextFunction } from "express";
import { app } from "../../main.js";
import { SessionRoute } from "../routes/session.route.js";
import { PlayerRoute } from "../routes/player.route.js";
import { GameRoute } from "../routes/game.route.js";
import { ChatRoute } from "../routes/chat.route.js";
import { AdminRoute } from "../routes/admin.route.js";
import { verifyToken, type JwtPayload } from "../utils/jwt.util.js";

declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayload;
    }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.jwtPayload = verifyToken(auth.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireHost(req: Request, res: Response, next: NextFunction) {
  if (req.jwtPayload?.role !== "host") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export class RouterUtil {
  static routes() {
    const sessionsRouter = Router();
    app.use("/api/sessions", sessionsRouter);

    // Öffentliche Routen (kein Token nötig)
    sessionsRouter.post("/", SessionRoute.create);
    sessionsRouter.get("/:code", SessionRoute.findByCode);
    sessionsRouter.post("/:id/players", PlayerRoute.join);

    // Nur Host
    sessionsRouter.patch("/:id", requireAuth, requireHost, SessionRoute.update);
    sessionsRouter.post("/:id/assignments", requireAuth, requireHost, GameRoute.assign);
    sessionsRouter.post("/:id/finalize", requireAuth, requireHost, GameRoute.finalize);
    sessionsRouter.patch("/:id/players/:playerId", requireAuth, requireHost, PlayerRoute.updateScore);

    // Authentifizierte Teilnehmer (Host oder Spieler)
    sessionsRouter.post("/:id/answers", requireAuth, GameRoute.answer);
    sessionsRouter.post("/:id/votes", requireAuth, GameRoute.vote);
    sessionsRouter.post("/:id/prevotes", requireAuth, GameRoute.prevote);
    sessionsRouter.post("/:id/guesses", requireAuth, GameRoute.guess);
    sessionsRouter.post("/:id/ready", requireAuth, GameRoute.ready);
    sessionsRouter.post("/:id/reflection", requireAuth, GameRoute.saveReflection);
    sessionsRouter.get("/:id/reflection/:playerId", requireAuth, GameRoute.getReflection);
    sessionsRouter.get("/:id/chat", requireAuth, ChatRoute.list);
    sessionsRouter.post("/:id/chat", requireAuth, ChatRoute.add);

    const cardsRouter = Router();
    app.use("/api/cards", cardsRouter);

    cardsRouter.get("/", AdminRoute.list);
    cardsRouter.post("/", AdminRoute.create);
    cardsRouter.put("/:id", AdminRoute.update);
    cardsRouter.delete("/:id", AdminRoute.remove);
  }
}

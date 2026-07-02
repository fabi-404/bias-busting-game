import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { app } from "../../main.js";
import { SessionRoute } from "../routes/session.route.js";
import { PlayerRoute } from "../routes/player.route.js";
import { GameRoute } from "../routes/game.route.js";
import { ChatRoute } from "../routes/chat.route.js";
import { AdminRoute } from "../routes/admin.route.js";
import { verifyToken, type JwtPayload } from "../utils/jwt.util.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrap(fn: (req: any, res: any, next: any) => Promise<any>): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}

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
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
    return;
  }
  try {
    req.jwtPayload = verifyToken(auth.slice(7));
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid token" });
  }
}

function requireHost(req: Request, res: Response, next: NextFunction) {
  if (req.jwtPayload?.role !== "host") {
    res.status(StatusCodes.FORBIDDEN).json({ error: "Forbidden" });
    return;
  }
  next();
}

export class RouterUtil {
  static routes() {
    const sessionsRouter = Router();
    app.use("/api/sessions", sessionsRouter);

    // Öffentliche Routen (kein Token nötig)
    sessionsRouter.post("/", wrap(SessionRoute.create));
    sessionsRouter.get("/:code", wrap(SessionRoute.findByCode));
    sessionsRouter.post("/:id/players", wrap(PlayerRoute.join));

    // Nur Host
    sessionsRouter.patch("/:id", requireAuth, requireHost, wrap(SessionRoute.update));
    sessionsRouter.post("/:id/assignments", requireAuth, requireHost, wrap(GameRoute.assign));
    sessionsRouter.post("/:id/finalize", requireAuth, requireHost, wrap(GameRoute.finalize));
    sessionsRouter.patch("/:id/players/:playerId", requireAuth, requireHost, wrap(PlayerRoute.updateScore));

    // Authentifizierte Teilnehmer (Host oder Spieler)
    sessionsRouter.post("/:id/answers", requireAuth, wrap(GameRoute.answer));
    sessionsRouter.post("/:id/votes", requireAuth, wrap(GameRoute.vote));
    sessionsRouter.post("/:id/prevotes", requireAuth, wrap(GameRoute.prevote));
    sessionsRouter.post("/:id/guesses", requireAuth, wrap(GameRoute.guess));
    sessionsRouter.post("/:id/ready", requireAuth, wrap(GameRoute.ready));
    sessionsRouter.post("/:id/reflection", requireAuth, wrap(GameRoute.saveReflection));
    sessionsRouter.get("/:id/reflection/:playerId", requireAuth, wrap(GameRoute.getReflection));
    sessionsRouter.get("/:id/chat", requireAuth, wrap(ChatRoute.list));
    sessionsRouter.post("/:id/chat", requireAuth, wrap(ChatRoute.add));

    const cardsRouter = Router();
    app.use("/api/cards", cardsRouter);

    cardsRouter.get("/", wrap(AdminRoute.list));
    cardsRouter.post("/", wrap(AdminRoute.create));
    cardsRouter.put("/:id", wrap(AdminRoute.update));
    cardsRouter.delete("/:id", wrap(AdminRoute.remove));
  }
}

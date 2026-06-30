import { Router } from "express";
import { app } from "../../main.js";
import { SessionRoute } from "../routes/session.route.js";
import { PlayerRoute } from "../routes/player.route.js";
import { GameRoute } from "../routes/game.route.js";
import { ChatRoute } from "../routes/chat.route.js";
import { AdminRoute } from "../routes/admin.route.js";

export class RouterUtil {
  static routes() {
    const sessionsRouter = Router();
    app.use("/api/sessions", sessionsRouter);

    sessionsRouter.post("/", SessionRoute.create);
    sessionsRouter.get("/:code", SessionRoute.findByCode);
    sessionsRouter.patch("/:id", SessionRoute.update);

    sessionsRouter.post("/:id/players", PlayerRoute.join);
    sessionsRouter.patch("/:id/players/:playerId", PlayerRoute.updateScore);

    sessionsRouter.post("/:id/assignments", GameRoute.assign);
    sessionsRouter.post("/:id/answers", GameRoute.answer);
    sessionsRouter.post("/:id/votes", GameRoute.vote);
    sessionsRouter.post("/:id/prevotes", GameRoute.prevote);
    sessionsRouter.post("/:id/guesses", GameRoute.guess);
    sessionsRouter.post("/:id/ready", GameRoute.ready);
    sessionsRouter.post("/:id/reflection", GameRoute.saveReflection);
    sessionsRouter.post("/:id/finalize", GameRoute.finalize);
    sessionsRouter.get("/:id/reflection/:playerId", GameRoute.getReflection);
    sessionsRouter.get("/:id/chat", ChatRoute.list);
    sessionsRouter.post("/:id/chat", ChatRoute.add);

    const cardsRouter = Router();
    app.use("/api/cards", cardsRouter);

    cardsRouter.get("/", AdminRoute.list);
    cardsRouter.post("/", AdminRoute.create);
    cardsRouter.put("/:id", AdminRoute.update);
    cardsRouter.delete("/:id", AdminRoute.remove);
  }
}

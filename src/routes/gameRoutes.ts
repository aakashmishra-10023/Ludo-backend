import { Router } from "express";
import * as gameController from "../controllers/gameController";

const router = Router();

router.post("/rooms/:roomId/start", gameController.startGame);
router.get("/rooms/:roomId/game", gameController.getGameState);
router.post("/rooms/:roomId/dice/roll", gameController.rollDice);
router.post("/rooms/:roomId/move", gameController.movePiece);
router.post("/rooms/:roomId/skip", gameController.skipTurn);
router.post("/rooms/:roomId/end", gameController.endGame);

export default router;

import { Router } from "express";
import * as playerController from "../controllers/playerController";

const router = Router();

router.get("/players/:playerId", playerController.getPlayerProfile);
router.put("/players/:playerId", playerController.updatePlayerProfile);
router.get(
  "/players/:playerId/statistics",
  playerController.getPlayerStatistics
);
router.get(
  "/players/:playerId/achievements",
  playerController.getPlayerAchievements
);

export default router;

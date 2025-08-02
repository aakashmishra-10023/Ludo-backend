import { Router } from "express";
import * as leaderboardController from "../controllers/leaderboardController";

const router = Router();

router.get("/leaderboard", leaderboardController.getGlobalLeaderboard);
router.get("/leaderboard/friends", leaderboardController.getFriendLeaderboard);
router.get("/statistics/games", leaderboardController.getGameStatistics);

export default router;

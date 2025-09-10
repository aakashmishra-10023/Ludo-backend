import { Router } from "express";
// import userRoutes from "./userRoutes";
import gameRoutes from "./gameRoutes";
import roomRoutes from "./roomRoutes";
import playerRoutes from "./playerRoutes";
import leaderboardRoutes from "./leaderboardRoutes";
import socialRoutes from "./socialRoutes";
import shopRoutes from "./shopRoutes";
import { subscriptionRouter } from "./subscription.route";
import { webhookRouter } from "./webhook.route";
// import other resource routers as needed

const router = Router();

// router.use(userRoutes);
router.use(gameRoutes);
router.use(roomRoutes);
router.use(playerRoutes);
router.use(leaderboardRoutes);
router.use(socialRoutes);
router.use(shopRoutes);
router.use("/subscription", subscriptionRouter);
router.use("/webhook", webhookRouter);
// add other routers here

export default router;

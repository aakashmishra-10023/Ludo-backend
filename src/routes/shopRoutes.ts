import { Router } from "express";
import * as shopController from "../controllers/shopController";

const router = Router();

router.get("/players/:playerId/balance", shopController.getPlayerBalance);
router.post("/purchases/coins", shopController.purchaseCoins);
router.get("/shop/items", shopController.getShopItems);
router.post("/shop/purchase", shopController.purchaseItem);

export default router;

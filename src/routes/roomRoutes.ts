import { Router } from "express";
import * as roomController from "../controllers/roomController";

const router = Router();

router.post("/rooms", roomController.createRoom);
router.post("/rooms/:roomId/join", roomController.joinRoom);
router.get("/rooms/:roomId", roomController.getRoom);
router.delete("/rooms/:roomId/players/:playerId", roomController.leaveRoom);
router.get("/rooms", roomController.listRooms);
// Add other room-related routes as needed

export default router;

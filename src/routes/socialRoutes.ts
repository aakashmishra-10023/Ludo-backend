import { Router } from "express";
import * as socialController from "../controllers/socialController";

const router = Router();

router.post("/friends/add", socialController.addFriend);
router.post("/friends/accept/:requestId", socialController.acceptFriendRequest);
router.get("/friends", socialController.getFriendsList);
router.post("/invitations/send", socialController.sendGameInvitation);
router.post(
  "/invitations/:invitationId/accept",
  socialController.acceptGameInvitation
);

export default router;

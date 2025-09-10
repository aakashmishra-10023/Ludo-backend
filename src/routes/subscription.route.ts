import { Router } from "express";
import { SubscriptionController } from "../controllers/subscription.controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Public routes
router.get("/plans", SubscriptionController.getPlans);

// Protected routes (require authentication)
router.use(authMiddleware);

// Subscription management routes
router.post("/create", SubscriptionController.createSubscription);
router.get("/my-subscription", SubscriptionController.getUserSubscription);
router.post(
  "/:subscriptionId/cancel",
  SubscriptionController.cancelSubscription
);
router.post("/:subscriptionId/pause", SubscriptionController.pauseSubscription);
router.post(
  "/:subscriptionId/resume",
  SubscriptionController.resumeSubscription
);

// Payment verification route (can be public for webhook)
router.post("/verify-payment", SubscriptionController.verifyPayment);

export { router as subscriptionRouter };

import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";
import { webhookMiddleware } from "../middlewares/webhook.middleware";

const router = Router();

// Razorpay webhook endpoint with raw body middleware
router.post("/razorpay", webhookMiddleware, WebhookController.handleWebhook);

export { router as webhookRouter };

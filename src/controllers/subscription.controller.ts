import { Request, Response } from "express";
import { SubscriptionService } from "../services/subscription.service";
import { logger } from "../utils/logger";
import { z } from "zod";

// Validation schemas
const createSubscriptionSchema = z.object({
  planType: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"]),
});

const cancelSubscriptionSchema = z.object({
  cancelAtCycleEnd: z.boolean().optional().default(false),
});

export class SubscriptionController {
  /**
   * Get available subscription plans
   */
  static async getPlans(req: Request, res: Response) {
    try {
      const plans = SubscriptionService.getSubscriptionPlans();

      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      logger.error("Error fetching subscription plans:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscription plans",
      });
    }
  }

  /**
   * Create a new subscription
   */
  static async createSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { planType } = createSubscriptionSchema.parse(req.body);

      // Check if user already has an active subscription
      const existingSubscription =
        await SubscriptionService.getUserActiveSubscription(userId);
      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          message: "User already has an active subscription",
        });
      }

      const result = await SubscriptionService.createSubscription(
        userId,
        planType
      );

      res.status(201).json({
        success: true,
        data: {
          subscription: result.subscription,
          shortUrl: result.subscription.short_url,
        },
        message: "Subscription created successfully",
      });
    } catch (error) {
      logger.error("Error creating subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create subscription",
      });
    }
  }

  /**
   * Get user's subscription details
   */
  static async getUserSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const subscription = await SubscriptionService.getUserActiveSubscription(
        userId
      );

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "No active subscription found",
        });
      }

      // Get Razorpay subscription details
      const razorpaySubscription = await SubscriptionService.getSubscription(
        subscription.razorpaySubscriptionId
      );

      res.status(200).json({
        success: true,
        data: {
          subscription: subscription.toObject(),
          razorpayDetails: razorpaySubscription,
        },
      });
    } catch (error) {
      logger.error("Error fetching user subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch subscription details",
      });
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { subscriptionId } = req.params;
      const { cancelAtCycleEnd } = cancelSubscriptionSchema.parse(req.body);

      // Verify subscription belongs to user
      const subscription = await SubscriptionService.getUserActiveSubscription(
        userId
      );
      if (
        !subscription ||
        subscription.razorpaySubscriptionId !== subscriptionId
      ) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found or does not belong to user",
        });
      }

      const result = await SubscriptionService.cancelSubscription(
        subscriptionId,
        cancelAtCycleEnd
      );

      res.status(200).json({
        success: true,
        data: result,
        message: cancelAtCycleEnd
          ? "Subscription will be cancelled at the end of current cycle"
          : "Subscription cancelled successfully",
      });
    } catch (error) {
      logger.error("Error cancelling subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to cancel subscription",
      });
    }
  }

  /**
   * Pause subscription
   */
  static async pauseSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { subscriptionId } = req.params;
      const { pauseAt = "cycle" } = req.body;

      // Verify subscription belongs to user
      const subscription = await SubscriptionService.getUserActiveSubscription(
        userId
      );
      if (
        !subscription ||
        subscription.razorpaySubscriptionId !== subscriptionId
      ) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found or does not belong to user",
        });
      }

      const result = await SubscriptionService.pauseSubscription(
        subscriptionId,
        pauseAt
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Subscription paused successfully",
      });
    } catch (error) {
      logger.error("Error pausing subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to pause subscription",
      });
    }
  }

  /**
   * Resume subscription
   */
  static async resumeSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const { subscriptionId } = req.params;

      // Verify subscription belongs to user
      const subscription = await SubscriptionService.getUserActiveSubscription(
        userId
      );
      if (
        !subscription ||
        subscription.razorpaySubscriptionId !== subscriptionId
      ) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found or does not belong to user",
        });
      }

      const result = await SubscriptionService.resumeSubscription(
        subscriptionId
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Subscription resumed successfully",
      });
    } catch (error) {
      logger.error("Error resuming subscription:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resume subscription",
      });
    }
  }

  /**
   * Verify subscription payment
   */
  static async verifyPayment(req: Request, res: Response) {
    try {
      const paymentData = req.body;

      const result = await SubscriptionService.verifySubscriptionPayment(
        paymentData
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Payment verified successfully",
      });
    } catch (error) {
      logger.error("Error verifying payment:", error);
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  }
}

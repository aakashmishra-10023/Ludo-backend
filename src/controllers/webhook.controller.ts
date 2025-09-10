import { Request, Response } from "express";
import {
  SubscriptionModel,
  SubscriptionStatus,
} from "../models/subscription.schema";
import { PaymentModel, PaymentStatus } from "../models/payment.schema";
import { UserModel } from "../models/user.schema";
import { logger } from "../utils/logger";
import { RAZORPAY_WEBHOOK_SECRET } from "../config/razorpay.config";
import crypto from "crypto";

export class WebhookController {
  /**
   * Handle Razorpay webhook events
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      const body = JSON.stringify(req.body);

      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        logger.error("Invalid webhook signature");
        return res.status(400).json({ error: "Invalid signature" });
      }

      const event = req.body;
      logger.info(`Received webhook event: ${event.event}`);

      // Handle different webhook events
      switch (event.event) {
        case "subscription.activated":
          await this.handleSubscriptionActivated(event);
          break;

        case "subscription.charged":
          await this.handleSubscriptionCharged(event);
          break;

        case "subscription.completed":
          await this.handleSubscriptionCompleted(event);
          break;

        case "subscription.cancelled":
          await this.handleSubscriptionCancelled(event);
          break;

        case "subscription.paused":
          await this.handleSubscriptionPaused(event);
          break;

        case "subscription.resumed":
          await this.handleSubscriptionResumed(event);
          break;

        case "subscription.halted":
          await this.handleSubscriptionHalted(event);
          break;

        case "payment.captured":
          await this.handlePaymentCaptured(event);
          break;

        case "payment.failed":
          await this.handlePaymentFailed(event);
          break;

        default:
          logger.info(`Unhandled webhook event: ${event.event}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error("Error handling webhook:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  /**
   * Handle subscription activated event
   */
  private static async handleSubscriptionActivated(event: any) {
    try {
      const subscriptionData = event.payload.subscription.entity;

      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionData.id },
        {
          status: SubscriptionStatus.ACTIVE,
          currentStart: new Date(subscriptionData.current_start * 1000),
          currentEnd: new Date(subscriptionData.current_end * 1000),
        }
      );

      // Update user subscription status
      const subscription = await SubscriptionModel.findOne({
        razorpaySubscriptionId: subscriptionData.id,
      });

      if (subscription) {
        await UserModel.findByIdAndUpdate(subscription.userId, {
          "subscription.isActive": true,
          "subscription.plan": subscription.plan,
          "subscription.startDate": new Date(
            subscriptionData.current_start * 1000
          ),
          "subscription.endDate": new Date(subscriptionData.current_end * 1000),
        });
      }

      logger.info(`Subscription activated: ${subscriptionData.id}`);
    } catch (error) {
      logger.error("Error handling subscription activated:", error);
    }
  }

  /**
   * Handle subscription charged event
   */
  private static async handleSubscriptionCharged(event: any) {
    try {
      const subscriptionData = event.payload.subscription.entity;
      const paymentData = event.payload.payment.entity;

      // Update subscription
      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionData.id },
        {
          currentStart: new Date(subscriptionData.current_start * 1000),
          currentEnd: new Date(subscriptionData.current_end * 1000),
          paidCount: subscriptionData.paid_count,
        }
      );

      // Create payment record
      const subscription = await SubscriptionModel.findOne({
        razorpaySubscriptionId: subscriptionData.id,
      });

      if (subscription) {
        const payment = new PaymentModel({
          userId: subscription.userId,
          subscriptionId: subscription._id,
          razorpayPaymentId: paymentData.id,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: PaymentStatus.CAPTURED,
          method: paymentData.method,
          description: paymentData.description,
          captured: paymentData.captured,
          email: paymentData.email,
          contact: paymentData.contact,
          notes: paymentData.notes,
        });

        await payment.save();

        // Update user subscription end date
        await UserModel.findByIdAndUpdate(subscription.userId, {
          "subscription.endDate": new Date(subscriptionData.current_end * 1000),
        });
      }

      logger.info(
        `Subscription charged: ${subscriptionData.id}, Payment: ${paymentData.id}`
      );
    } catch (error) {
      logger.error("Error handling subscription charged:", error);
    }
  }

  /**
   * Handle subscription completed event
   */
  private static async handleSubscriptionCompleted(event: any) {
    try {
      const subscriptionData = event.payload.subscription.entity;

      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionData.id },
        {
          status: SubscriptionStatus.EXPIRED,
          endedAt: new Date(),
        }
      );

      // Update user subscription status
      const subscription = await SubscriptionModel.findOne({
        razorpaySubscriptionId: subscriptionData.id,
      });

      if (subscription) {
        await UserModel.findByIdAndUpdate(subscription.userId, {
          "subscription.isActive": false,
        });
      }

      logger.info(`Subscription completed: ${subscriptionData.id}`);
    } catch (error) {
      logger.error("Error handling subscription completed:", error);
    }
  }

  /**
   * Handle subscription cancelled event
   */
  private static async handleSubscriptionCancelled(event: any) {
    try {
      const subscriptionData = event.payload.subscription.entity;

      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionData.id },
        {
          status: SubscriptionStatus.CANCELLED,
          endedAt: new Date(),
        }
      );

      // Update user subscription status
      const subscription = await SubscriptionModel.findOne({
        razorpaySubscriptionId: subscriptionData.id,
      });

      if (subscription) {
        await UserModel.findByIdAndUpdate(subscription.userId, {
          "subscription.isActive": false,
        });
      }

      logger.info(`Subscription cancelled: ${subscriptionData.id}`);
    } catch (error) {
      logger.error("Error handling subscription cancelled:", error);
    }
  }

  /**
   * Handle subscription paused event
   */
  private static async handleSubscriptionPaused(event: any) {
    try {
      const subscriptionData = event.payload.subscription.entity;

      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionData.id },
        { status: SubscriptionStatus.PAUSED }
      );

      logger.info(`Subscription paused: ${subscriptionData.id}`);
    } catch (error) {
      logger.error("Error handling subscription paused:", error);
    }
  }

  /**
   * Handle subscription resumed event
   */
  private static async handleSubscriptionResumed(event: any) {
    try {
      const subscriptionData = event.payload.subscription.entity;

      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionData.id },
        { status: SubscriptionStatus.ACTIVE }
      );

      logger.info(`Subscription resumed: ${subscriptionData.id}`);
    } catch (error) {
      logger.error("Error handling subscription resumed:", error);
    }
  }

  /**
   * Handle subscription halted event
   */
  private static async handleSubscriptionHalted(event: any) {
    try {
      const subscriptionData = event.payload.subscription.entity;

      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionData.id },
        {
          status: SubscriptionStatus.CANCELLED,
          endedAt: new Date(),
        }
      );

      // Update user subscription status
      const subscription = await SubscriptionModel.findOne({
        razorpaySubscriptionId: subscriptionData.id,
      });

      if (subscription) {
        await UserModel.findByIdAndUpdate(subscription.userId, {
          "subscription.isActive": false,
        });
      }

      logger.info(`Subscription halted: ${subscriptionData.id}`);
    } catch (error) {
      logger.error("Error handling subscription halted:", error);
    }
  }

  /**
   * Handle payment captured event
   */
  private static async handlePaymentCaptured(event: any) {
    try {
      const paymentData = event.payload.payment.entity;

      await PaymentModel.findOneAndUpdate(
        { razorpayPaymentId: paymentData.id },
        {
          status: PaymentStatus.CAPTURED,
          captured: true,
        }
      );

      logger.info(`Payment captured: ${paymentData.id}`);
    } catch (error) {
      logger.error("Error handling payment captured:", error);
    }
  }

  /**
   * Handle payment failed event
   */
  private static async handlePaymentFailed(event: any) {
    try {
      const paymentData = event.payload.payment.entity;

      await PaymentModel.findOneAndUpdate(
        { razorpayPaymentId: paymentData.id },
        {
          status: PaymentStatus.FAILED,
          errorCode: paymentData.error_code,
          errorDescription: paymentData.error_description,
          errorSource: paymentData.error_source,
          errorStep: paymentData.error_step,
          errorReason: paymentData.error_reason,
        }
      );

      logger.info(`Payment failed: ${paymentData.id}`);
    } catch (error) {
      logger.error("Error handling payment failed:", error);
    }
  }
}

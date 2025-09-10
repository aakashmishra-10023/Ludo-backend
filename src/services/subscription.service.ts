import {
  razorpay,
  SUBSCRIPTION_PLANS,
  SubscriptionPlanType,
} from "../config/razorpay.config";
import {
  SubscriptionModel,
  SubscriptionStatus,
  SubscriptionPlan,
} from "../models/subscription.schema";
import { PaymentModel, PaymentStatus } from "../models/payment.schema";
import { UserModel } from "../models/user.schema";
import { logger } from "../utils/logger";

export class SubscriptionService {
  /**
   * Create a Razorpay plan
   */
  static async createPlan(planType: SubscriptionPlanType) {
    try {
      const plan = SUBSCRIPTION_PLANS[planType];

      const razorpayPlan = await razorpay.plans.create({
        period: plan.interval,
        interval: plan.period,
        item: {
          name: plan.name,
          amount: plan.amount,
          currency: plan.currency,
          description: plan.description,
        },
      });

      logger.info(`Created Razorpay plan: ${planType}`, {
        planId: razorpayPlan.id,
      });
      return razorpayPlan;
    } catch (error) {
      logger.error("Error creating Razorpay plan:", error);
      throw error;
    }
  }

  /**
   * Create a Razorpay customer
   */
  static async createCustomer(userData: {
    email: string;
    name?: string;
    contact?: string;
  }) {
    try {
      const customer = (await razorpay.customers.create({
        name: userData.name || "User",
        email: userData.email,
        contact: userData.contact,
        fail_existing: 0,
      })) as any;

      logger.info(`Created Razorpay customer: ${customer.id}`);
      return customer;
    } catch (error) {
      logger.error("Error creating Razorpay customer:", error);
      throw error;
    }
  }

  /**
   * Create a subscription for a user
   */
  static async createSubscription(
    userId: string,
    planType: SubscriptionPlanType
  ) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const plan = SUBSCRIPTION_PLANS[planType];

      // Create subscription registration link with customer association
      const registrationLink =
        (await razorpay.subscriptions.createRegistrationLink({
          customer: {
            name: user.userName || "User",
            email: user.email,
          },
          type: "link",
          amount: plan.amount,
          currency: plan.currency,
          description: `${plan.name} - ${user.userName || user.email}`,
          subscription_registration: {
            method: "card",
            max_amount: plan.amount,
            expire_at: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          },
          receipt: `receipt_${userId}_${Date.now()}`,
          email_notify: true,
          sms_notify: true,
          expire_by: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days from now
          notes: {
            user_id: userId,
            plan_type: planType,
          },
        })) as any;

      // Save subscription to database
      const subscriptionDoc = new SubscriptionModel({
        userId,
        plan: planType.toLowerCase() as SubscriptionPlan,
        status: SubscriptionStatus.INACTIVE,
        razorpaySubscriptionId: registrationLink.id, // This will be the invoice ID initially
        razorpayPlanId: plan.id,
        currentStart: new Date(),
        currentEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        quantity: 1,
        shortUrl: registrationLink.short_url,
        customerDetails: {
          email: user.email,
          name: user.userName,
        },
      });

      await subscriptionDoc.save();

      logger.info(`Created subscription registration link for user ${userId}`, {
        registrationLinkId: registrationLink.id,
        plan: planType,
      });

      return {
        subscription: registrationLink,
        subscriptionDoc,
      };
    } catch (error) {
      logger.error("Error creating subscription:", error);
      throw error;
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(subscriptionId: string) {
    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error("Error fetching subscription:", error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = false
  ) {
    try {
      const subscription = await razorpay.subscriptions.cancel(
        subscriptionId,
        cancelAtCycleEnd
      );

      // Update database
      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionId },
        {
          status: cancelAtCycleEnd
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.CANCELLED,
          endedAt: cancelAtCycleEnd ? null : new Date(),
        }
      );

      logger.info(`Cancelled subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error("Error cancelling subscription:", error);
      throw error;
    }
  }

  /**
   * Pause a subscription
   */
  static async pauseSubscription(
    subscriptionId: string,
    pauseAt: "now" | "cycle"
  ) {
    try {
      const subscription = await razorpay.subscriptions.pause(subscriptionId, {
        pause_at: pauseAt === "cycle" ? "now" : pauseAt,
      } as any);

      // Update database
      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionId },
        { status: SubscriptionStatus.PAUSED }
      );

      logger.info(`Paused subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error("Error pausing subscription:", error);
      throw error;
    }
  }

  /**
   * Resume a subscription
   */
  static async resumeSubscription(subscriptionId: string) {
    try {
      const subscription = await razorpay.subscriptions.resume(subscriptionId);

      // Update database
      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: subscriptionId },
        { status: SubscriptionStatus.ACTIVE }
      );

      logger.info(`Resumed subscription: ${subscriptionId}`);
      return subscription;
    } catch (error) {
      logger.error("Error resuming subscription:", error);
      throw error;
    }
  }

  /**
   * Get user's active subscription
   */
  static async getUserActiveSubscription(userId: string) {
    try {
      const subscription = await SubscriptionModel.findOne({
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
      }).populate("userId");

      return subscription;
    } catch (error) {
      logger.error("Error fetching user subscription:", error);
      throw error;
    }
  }

  /**
   * Get subscription plans
   */
  static getSubscriptionPlans() {
    return Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
      id: key.toLowerCase(),
      name: plan.name,
      amount: plan.amount,
      currency: plan.currency,
      interval: plan.interval,
      period: plan.period,
      description: plan.description,
      displayAmount: `₹${(plan.amount / 100).toFixed(2)}`,
    }));
  }

  /**
   * Verify subscription payment
   */
  static async verifySubscriptionPayment(paymentData: any) {
    try {
      const {
        razorpay_payment_id,
        razorpay_subscription_id,
        razorpay_signature,
      } = paymentData;

      // Verify signature
      const crypto = require("crypto");
      const { RAZORPAY_WEBHOOK_SECRET } = require("../config/razorpay.config");

      const body = razorpay_subscription_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        throw new Error("Invalid signature");
      }

      // Fetch payment details
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      // Update subscription status
      await SubscriptionModel.findOneAndUpdate(
        { razorpaySubscriptionId: razorpay_subscription_id },
        { status: SubscriptionStatus.ACTIVE }
      );

      // Update user subscription
      const subscription = await SubscriptionModel.findOne({
        razorpaySubscriptionId: razorpay_subscription_id,
      });

      if (subscription) {
        await UserModel.findByIdAndUpdate(subscription.userId, {
          "subscription.isActive": true,
          "subscription.plan": subscription.plan,
          "subscription.startDate": subscription.currentStart,
          "subscription.endDate": subscription.currentEnd,
        });
      }

      logger.info(`Verified subscription payment: ${razorpay_payment_id}`);
      return payment;
    } catch (error) {
      logger.error("Error verifying subscription payment:", error);
      throw error;
    }
  }
}

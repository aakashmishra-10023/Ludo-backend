import { UserModel } from "../models/user.schema";
import {
  SubscriptionModel,
  SubscriptionStatus,
} from "../models/subscription.schema";

export class SubscriptionUtils {
  /**
   * Check if user has active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const user = await UserModel.findById(userId);
      if (!user || !user.subscription?.isActive) {
        return false;
      }

      // Check if subscription is not expired
      if (user.subscription.endDate && new Date() > user.subscription.endDate) {
        // Update user subscription status
        await UserModel.findByIdAndUpdate(userId, {
          "subscription.isActive": false,
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error checking subscription status:", error);
      return false;
    }
  }

  /**
   * Get user's subscription details
   */
  static async getUserSubscriptionDetails(userId: string) {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return null;
      }

      const subscription = await SubscriptionModel.findOne({
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED] },
      });

      return {
        user: {
          isActive: user.subscription?.isActive || false,
          plan: user.subscription?.plan,
          startDate: user.subscription?.startDate,
          endDate: user.subscription?.endDate,
        },
        subscription: subscription
          ? {
              id: subscription.razorpaySubscriptionId,
              plan: subscription.plan,
              status: subscription.status,
              currentStart: subscription.currentStart,
              currentEnd: subscription.currentEnd,
            }
          : null,
      };
    } catch (error) {
      console.error("Error getting subscription details:", error);
      return null;
    }
  }

  /**
   * Check if user can access premium features
   */
  static async canAccessPremiumFeatures(userId: string): Promise<boolean> {
    return await this.hasActiveSubscription(userId);
  }

  /**
   * Get subscription expiry date
   */
  static async getSubscriptionExpiry(userId: string): Promise<Date | null> {
    try {
      const user = await UserModel.findById(userId);
      return user?.subscription?.endDate || null;
    } catch (error) {
      console.error("Error getting subscription expiry:", error);
      return null;
    }
  }

  /**
   * Get days until subscription expires
   */
  static async getDaysUntilExpiry(userId: string): Promise<number | null> {
    try {
      const expiryDate = await this.getSubscriptionExpiry(userId);
      if (!expiryDate) {
        return null;
      }

      const now = new Date();
      const diffTime = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error("Error calculating days until expiry:", error);
      return null;
    }
  }
}

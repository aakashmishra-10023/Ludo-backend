import { Request, Response, NextFunction } from "express";
import { SubscriptionUtils } from "../utils/subscription.utils";

/**
 * Middleware to check if user has active subscription
 */
export const requireSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const hasActiveSubscription = await SubscriptionUtils.hasActiveSubscription(
      userId
    );

    if (!hasActiveSubscription) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required",
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Error in subscription middleware:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Middleware to optionally check subscription (doesn't block if no subscription)
 */
export const optionalSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (userId) {
      const hasActiveSubscription =
        await SubscriptionUtils.hasActiveSubscription(userId);
      (req as any).hasActiveSubscription = hasActiveSubscription;
    }

    next();
  } catch (error) {
    console.error("Error in optional subscription middleware:", error);
    next(); // Continue even if there's an error
  }
};

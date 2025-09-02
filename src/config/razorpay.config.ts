import Razorpay from "razorpay";
import { env } from "./env.config";

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const RAZORPAY_WEBHOOK_SECRET = env.RAZORPAY_WEBHOOK_SECRET;

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  WEEKLY: {
    id: "plan_weekly",
    name: "Weekly Premium",
    amount: 9900, // ₹99.00 in paise
    currency: "INR",
    interval: "weekly",
    period: 1,
    description: "Weekly premium subscription for Ludo game",
  },
  MONTHLY: {
    id: "plan_monthly",
    name: "Monthly Premium",
    amount: 29900, // ₹299.00 in paise
    currency: "INR",
    interval: "monthly",
    period: 1,
    description: "Monthly premium subscription for Ludo game",
  },
  QUARTERLY: {
    id: "plan_quarterly",
    name: "Quarterly Premium",
    amount: 79900, // ₹799.00 in paise
    currency: "INR",
    interval: "monthly",
    period: 3,
    description: "Quarterly premium subscription for Ludo game",
  },
  ANNUAL: {
    id: "plan_annual",
    name: "Annual Premium",
    amount: 299900, // ₹2999.00 in paise
    currency: "INR",
    interval: "yearly",
    period: 1,
    description: "Annual premium subscription for Ludo game",
  },
} as const;

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PLANS;

import { Schema, InferSchemaType, HydratedDocument } from "mongoose";
import { mongoConnection } from "../databases/mongodb/mongodb.connection";

export enum SubscriptionStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  PAUSED = "paused",
}

export enum SubscriptionPlan {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  ANNUAL = "annual",
}

const SubscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.INACTIVE,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPlanId: {
      type: String,
      required: true,
    },
    currentStart: {
      type: Date,
      required: true,
    },
    currentEnd: {
      type: Date,
      required: true,
    },
    endedAt: {
      type: Date,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    shortUrl: {
      type: String,
    },
    hasScheduledChanges: {
      type: Boolean,
      default: false,
    },
    changeScheduledAt: {
      type: Date,
    },
    remainingCount: {
      type: Number,
    },
    customerNotify: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: Map,
      of: String,
    },
    chargeAt: {
      type: Number,
    },
    startAt: {
      type: Number,
    },
    endAt: {
      type: Number,
    },
    authAttempts: {
      type: Number,
      default: 0,
    },
    totalCount: {
      type: Number,
    },
    paidCount: {
      type: Number,
      default: 0,
    },
    customerDetails: {
      email: { type: String },
      contact: { type: String },
      name: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ razorpaySubscriptionId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentEnd: 1 });

export type Subscription = InferSchemaType<typeof SubscriptionSchema>;
export type SubscriptionDocument = HydratedDocument<Subscription>;

export const SubscriptionModel = mongoConnection
  .getConnection()
  .model<Subscription>("Subscription", SubscriptionSchema);

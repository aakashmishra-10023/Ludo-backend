import { Schema, InferSchemaType, HydratedDocument } from "mongoose";
import { mongoConnection } from "../databases/mongodb/mongodb.connection";

export enum PaymentStatus {
  CREATED = "created",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  REFUNDED = "refunded",
  FAILED = "failed",
}

export enum PaymentMethod {
  CARD = "card",
  NETBANKING = "netbanking",
  WALLET = "wallet",
  UPI = "upi",
  EMI = "emi",
  COD = "cod",
}

const PaymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
    },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.CREATED,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
    },
    description: {
      type: String,
    },
    notes: {
      type: Map,
      of: String,
    },
    fee: {
      type: Number,
    },
    tax: {
      type: Number,
    },
    errorCode: {
      type: String,
    },
    errorDescription: {
      type: String,
    },
    errorSource: {
      type: String,
    },
    errorStep: {
      type: String,
    },
    errorReason: {
      type: String,
    },
    international: {
      type: Boolean,
      default: false,
    },
    refundStatus: {
      type: String,
    },
    amountRefunded: {
      type: Number,
      default: 0,
    },
    captured: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
    cardId: {
      type: String,
    },
    bank: {
      type: String,
    },
    wallet: {
      type: String,
    },
    vpa: {
      type: String,
    },
    email: {
      type: String,
    },
    contact: {
      type: String,
    },
    orderId: {
      type: String,
    },
    invoiceId: {
      type: String,
    },
    acquirerData: {
      rrn: { type: String },
      upiTransactionId: { type: String },
      authCode: { type: String },
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
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ razorpayPaymentId: 1 });
PaymentSchema.index({ subscriptionId: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

export type Payment = InferSchemaType<typeof PaymentSchema>;
export type PaymentDocument = HydratedDocument<Payment>;

export const PaymentModel = mongoConnection
  .getConnection()
  .model<Payment>("Payment", PaymentSchema);

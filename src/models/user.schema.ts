import { Schema, InferSchemaType, HydratedDocument } from "mongoose";
import { mongoConnection } from "../databases/mongodb/mongodb.connection";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    userName: { type: String },
    avatarUrl: { type: String },
    socialType: { type: String },
    socialId: { type: String },
    subscription: {
      isActive: { type: Boolean, default: false },
      plan: {
        type: String,
        enum: ["weekly", "monthly", "quarterly", "annual"],
      },
      startDate: { type: Date },
      endDate: { type: Date },
      razorpayCustomerId: { type: String },
    },
    preferences: {
      notifications: { type: Boolean, default: true },
      autoRenew: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;

export type UserDocument = HydratedDocument<User>;

export const UserModel = mongoConnection
  .getConnection()
  .model<User>("User", UserSchema);

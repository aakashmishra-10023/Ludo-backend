import { Schema, InferSchemaType, HydratedDocument } from "mongoose";
import { mongoConnection } from "../databases/mongodb/mongodb.connection";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    userName: { type: String },
    profilePicture: { type: String },
    socialType: { type: String },
    socialId: { type: String },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;

export type UserDocument = HydratedDocument<User>;

export const UserModel = mongoConnection.getConnection().model<User>("User", UserSchema);

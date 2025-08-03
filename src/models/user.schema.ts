import mongoose, { Document, Schema } from "mongoose";
import { mongoConnection } from "../databases/mongodb/mongodb.connection";

export interface IUser extends Document {
  _id: string;
  email: string;
  password?: string;
  displayName?: string;
  profilePicture?: string;
  socialType?: string;
  socialId?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  displayName: { type: String },
  profilePicture: { type: String },
  socialType: { type: String },
  socialId: { type: String },
});

export const $UserModel= mongoConnection.getConnection().model<IUser>('User',UserSchema)
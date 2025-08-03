import mongoose, { Document, Schema } from "mongoose";

export interface IFriend extends Document {
  playerId: string;
  friendId: string;
  status: string;
  message?: string;
  createdAt: Date;
}

const FriendSchema = new Schema<IFriend>({
  playerId: { type: String, required: true },
  friendId: { type: String, required: true },
  status: { type: String, required: true },
  message: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IFriend>("Friend", FriendSchema);

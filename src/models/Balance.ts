import mongoose, { Document, Schema } from "mongoose";

export interface IBalance extends Document {
  playerId: string;
  coins: number;
  diamonds: number;
  updatedAt: Date;
}

const BalanceSchema = new Schema<IBalance>({
  playerId: { type: String, required: true, unique: true },
  coins: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<IBalance>("Balance", BalanceSchema);

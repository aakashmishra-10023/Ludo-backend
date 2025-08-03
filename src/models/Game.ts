import mongoose, { Document, Schema } from "mongoose";

export interface IGame extends Document {
  roomId: string;
  status: string;
  players: string[];
}

const GameSchema = new Schema<IGame>({
  roomId: { type: String, required: true },
  status: { type: String, required: true },
  players: [{ type: String, required: true }],
});

export default mongoose.model<IGame>("Game", GameSchema);

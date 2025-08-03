import mongoose, { Document, Schema } from "mongoose";

export interface IGameState extends Document {
  roomId: string;
  status: string;
  currentTurn: string | null;
  diceValue: number | null;
  pieces: any;
  board: any;
}

const GameStateSchema = new Schema<IGameState>({
  roomId: { type: String, required: true, unique: true },
  status: { type: String, required: true },
  currentTurn: { type: String, default: null },
  diceValue: { type: Number, default: null },
  pieces: { type: Schema.Types.Mixed, default: {} },
  board: { type: Schema.Types.Mixed, default: {} },
});

export default mongoose.model<IGameState>("GameState", GameStateSchema);

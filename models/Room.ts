import mongoose, { Document, Schema } from "mongoose";

export interface IRoom extends Document {
  roomId: string;
  gameType: string;
  maxPlayers: number;
  entryAmount: number;
  isPrivate: boolean;
  password?: string;
  createdBy: string;
  createdAt: Date;
  players: any[];
  gameState: any;
  settings?: any;
}

const RoomSchema = new Schema<IRoom>({
  roomId: { type: String, required: true, unique: true },
  gameType: { type: String, required: true },
  maxPlayers: { type: Number, required: true },
  entryAmount: { type: Number, required: true },
  isPrivate: { type: Boolean, required: true },
  password: { type: String },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, required: true },
  players: { type: Schema.Types.Mixed, default: [] },
  gameState: { type: Schema.Types.Mixed, default: {} },
  settings: { type: Schema.Types.Mixed },
});

export default mongoose.model<IRoom>("Room", RoomSchema);

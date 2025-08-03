import mongoose, { Document, Schema } from "mongoose";

export interface IPlayer extends Document {
  playerId: string;
  displayName: string;
  profilePicture?: string;
  preferences?: any;
  statistics?: any;
  achievements?: any[];
  balance?: any;
}

const PlayerSchema = new Schema<IPlayer>({
  playerId: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  profilePicture: { type: String },
  preferences: { type: Schema.Types.Mixed, default: {} },
  statistics: { type: Schema.Types.Mixed, default: {} },
  achievements: { type: [Schema.Types.Mixed], default: [] },
  balance: { type: Schema.Types.Mixed, default: {} },
});

export default mongoose.model<IPlayer>("Player", PlayerSchema);

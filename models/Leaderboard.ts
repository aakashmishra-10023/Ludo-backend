import mongoose, { Document, Schema } from "mongoose";

export interface ILeaderboard extends Document {
  type: string;
  players: { playerId: string; score: number }[];
  createdAt: Date;
}

const LeaderboardSchema = new Schema<ILeaderboard>({
  type: { type: String, required: true },
  players: [
    {
      playerId: { type: String, required: true },
      score: { type: Number, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ILeaderboard>("Leaderboard", LeaderboardSchema);

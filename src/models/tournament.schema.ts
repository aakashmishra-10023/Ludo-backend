import { Schema, InferSchemaType, HydratedDocument } from "mongoose";
import { mongoConnection } from "../databases/mongodb/mongodb.connection";

const TournamentSchema = new Schema(
  {
    tournamentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    createdBy: { type: String, required: true }, // admin user ID
    joiningOpen: { type: Boolean, default: true },
    maxPlayersPerRoom: { type: Number, default: 4 },
    currentRound: { type: Number, default: 0 },
    playerLimit: { type: Number, default: 16 }, 
    winner: { type: String, default: null },
    status: {
      type: String,
      enum: ["JOINING", "IN_PROGRESS", "COMPLETED"],
      default: "JOINING",
    },
    players: [
      {
        userId: { type: String, required: true },
        userName: { type: String },
      },
    ],
    rooms: [
      {
        roomId: { type: String, required: true },
        players: [
          {
            userId: { type: String, required: true },
            userName: { type: String },
            socketId: { type: String },
            isOnline: { type: Boolean, default: true },
          },
        ],
        gameStarted: { type: Boolean, default: false },
        gameState: { type: Schema.Types.Mixed, default: null },
        createdAt: { type: Date, default: Date.now },
        maxPlayers: { type: Number, default: 4 },
      },
    ],
  },
  { timestamps: true }
);

export type Tournament = InferSchemaType<typeof TournamentSchema>;
export type TournamentDocument = HydratedDocument<Tournament>;

export const TournamentModel =
  mongoConnection
    .getConnection()
    .model<Tournament>("Tournament", TournamentSchema);

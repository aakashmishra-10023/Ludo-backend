import { z } from "zod";
import Player, { IPlayer } from "../models/Player";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1),
  profilePicture: z.string().optional(),
  preferences: z.any().optional(),
});

export async function getPlayerProfile(playerId: string) {
  const player = await Player.findOne({ playerId });
  if (!player) throw new Error("Player not found");
  return player;
}

export async function updatePlayerProfile(
  playerId: string,
  data: z.infer<typeof updateProfileSchema>
) {
  const player = await Player.findOneAndUpdate(
    { playerId },
    { $set: data },
    { new: true }
  );
  if (!player) throw new Error("Player not found");
  return player;
}

export async function getPlayerStatistics(playerId: string) {
  const player = await Player.findOne({ playerId });
  if (!player) throw new Error("Player not found");
  return player.statistics || {};
}

export async function getPlayerAchievements(playerId: string) {
  const player = await Player.findOne({ playerId });
  if (!player) throw new Error("Player not found");
  return player.achievements || [];
}

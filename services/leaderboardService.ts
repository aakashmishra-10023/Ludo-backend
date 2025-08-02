import Leaderboard, { ILeaderboard } from "../models/Leaderboard";
import Player from "../models/Player";

export async function getGlobalLeaderboard(limit: number = 100) {
  // Example: sort players by statistics.score (descending)
  const players = await Player.find()
    .sort({ "statistics.score": -1 })
    .limit(limit);
  return players.map((p) => ({
    playerId: p.playerId,
    displayName: p.displayName,
    score: p.statistics?.score || 0,
  }));
}

export async function getFriendLeaderboard(playerId: string) {
  // Stub: Would require friend relationships
  return [];
}

export async function getGameStatistics() {
  // Example: aggregate total games, wins, losses
  const totalPlayers = await Player.countDocuments();
  const totalGames = await Player.aggregate([
    { $group: { _id: null, total: { $sum: "$statistics.totalGames" } } },
  ]);
  const totalWins = await Player.aggregate([
    { $group: { _id: null, total: { $sum: "$statistics.wins" } } },
  ]);
  const totalLosses = await Player.aggregate([
    { $group: { _id: null, total: { $sum: "$statistics.losses" } } },
  ]);
  return {
    totalPlayers,
    totalGames: totalGames[0]?.total || 0,
    totalWins: totalWins[0]?.total || 0,
    totalLosses: totalLosses[0]?.total || 0,
  };
}

import { Request, Response } from "express";
import * as leaderboardService from "../services/leaderboardService";

export const getGlobalLeaderboard = async (req: Request, res: Response) => {
  // TODO: Implement getGlobalLeaderboard logic
  res.status(200).json([]);
};

export const getFriendLeaderboard = async (req: Request, res: Response) => {
  // TODO: Implement getFriendLeaderboard logic
  res.status(200).json([]);
};

export const getGameStatistics = async (req: Request, res: Response) => {
  // TODO: Implement getGameStatistics logic
  res.status(200).json({});
};

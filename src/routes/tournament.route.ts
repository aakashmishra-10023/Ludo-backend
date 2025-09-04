import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { redisClient } from "../config/redis.config";
import { TournamentModel } from "../models/tournament.schema";
import { Tournament } from "../interfaces/tournament.interface";
import { tournamentQueue } from "../queues/tournament.queue";
import { TOURNAMENT_STATUSES } from "../constants/tournament.constants";

class TournamentRouter {
  private router!: Router;

  constructor() {
    this.router = Router();
  }

  UseRouter() {
    this.router.post(
      "/create-tournament",
      async (req: Request, res: Response) => {
        try {
          const { name, adminId, maxPlayersPerRoom, playerLimit } = req.body;

          if (!name || !adminId || !maxPlayersPerRoom) {
            return res.status(400).json({ message: "Missing required fields" });
          }

          const tournamentId = uuidv4();

          const tournamentData: Tournament = {
            tournamentId,
            name,
            playerLimit,
            createdBy: adminId,
            createdAt: Date.now(),
            joiningOpen: true,
            players: [],
            rooms: [],
            maxPlayersPerRoom,
            status: TOURNAMENT_STATUSES.JOINING as "JOINING" | "IN_PROGRESS" | "COMPLETED",
            currentRound: 0,
          };

          const tournamentDB = await TournamentModel.create(tournamentData);

          await redisClient.set(`tournament:${tournamentId}`, JSON.stringify(tournamentData));

          await tournamentQueue.add(
            "closeJoiningAndStart",
            { tournamentId },
            {
              delay: 2 * 60 * 1000,
              jobId: tournamentId, 
              // removeOnComplete: true, 
              // removeOnFail: true, 
            }
          );

          res.status(201).json({
            message: "Tournament created successfully",
            tournament: tournamentDB,
          });
        } catch (error) {
          console.error("Error creating tournament:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      }
    );

    this.router.get(
      "/list-tournaments",
      async (req: Request, res: Response) => {
        try {
          const tournaments = await TournamentModel.find({status: TOURNAMENT_STATUSES.JOINING}).sort({ createdAt: -1 }); 

          res.status(200).json({
            message: "Tournaments fetched successfully",
            total: tournaments.length,
            tournaments,
          });
        } catch (error) {
          console.error("Error fetching tournaments:", error);
          res.status(500).json({ message: "Internal server error" });
        }
      }
    );

    return this.router;
  }
}

export const tournamentRouter = new TournamentRouter();

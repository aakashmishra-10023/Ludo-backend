import cron from "node-cron";
import { v4 as uuidv4 } from "uuid";
import { redisClient } from "../config/redis.config";
import { TournamentModel } from "../models/tournament.schema";
import { tournamentQueue } from "../queues/tournament.queue";
import { MAX_PLAYERS_PER_ROOM, MAX_PLAYERS_PER_TOURNAMENT, TOURNAMENT, TOURNAMENT_CREATION, TOURNAMENT_STATUSES } from "../constants.ts/tournament.constants";
import { Tournament } from "../interfaces/tournament.interface";

export const startTournamentScheduler = () => {
  cron.schedule(TOURNAMENT.SCHEDULE_TIME, async () => {
    try {
      console.log("Creating tournament automatically...");

      const tournamentId = uuidv4();
      const tournamentData: Tournament = {
        tournamentId,
        name: `Hourly Tournament - ${new Date().toLocaleTimeString()}`,
        playerLimit: MAX_PLAYERS_PER_TOURNAMENT, 
        createdBy: TOURNAMENT_CREATION.SYSTEM, 
        createdAt: Date.now(),
        joiningOpen: true,
        players: [],
        rooms: [],
        maxPlayersPerRoom: MAX_PLAYERS_PER_ROOM, 
        status: TOURNAMENT_STATUSES.JOINING,
        currentRound: 0,
      };

      const tournamentDB = await TournamentModel.create(tournamentData);

      await redisClient.set(
        `tournament:${tournamentId}`,
        JSON.stringify(tournamentData)
      );

      await tournamentQueue.add(
        "closeJoiningAndStart",
        { tournamentId },
        {
          delay: 2 * 60 * 1000,
          jobId: tournamentId,
        }
      );

      console.log(`Tournament ${tournamentId} created successfully`);
    } catch (error) {
      console.error("Error auto-creating tournament:", error);
    }
  });

  console.log("Tournament scheduler started successfully");
};

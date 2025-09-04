import { Worker } from "bullmq";
import { env } from "../config/env.config";
import { SocketService } from "../sockets";
import {
  closeJoiningAndStart,
  proceedToNextRound,
} from "../sockets/handlers/tournamentGame.handler";
import { redisClient } from "../config/redis.config";
import { tournamentQueue } from "../queues/tournament.queue";

export const worker = () =>
  new Worker(
    "tournamentQueue",
    async (job) => {
      try {
        if (job.name === "closeJoiningAndStart") {
          const { tournamentId } = job.data;
          console.log(`Processing closeJoiningAndStart for ${tournamentId}`);
          await closeJoiningAndStart(tournamentId, SocketService.getIO());
        } else if (job.name === "matchMonitioring") {
          const { tournamentId } = job.data;

          const tournament = await redisClient.get(
            `tournament:${tournamentId}`
          );
          if (!tournament) return;

          const rooms = tournament.rooms || [];

          if (rooms.length === 0) return;

          let allFinished = true;
          for (const room of rooms) {
            const roomData = await redisClient.get(`room:${room.roomId}`);
            if (!roomData) {
              allFinished = false;
              break;
            }
            if (!roomData.gameState?.winner) {
              allFinished = false;
              break;
            }
          }

          if (allFinished) {
            try {
              const schedulers = await tournamentQueue.getJobSchedulers();
              const jobToRemove = schedulers.find(
                (job) => job.id === `matchMonitioring-${tournamentId}`
              );

              if (jobToRemove) {
                await tournamentQueue.removeJobScheduler(jobToRemove.id);
                console.log(
                  `Stopped matchMonitioring job for tournament ${tournamentId}`
                );
              }
            } catch (err) {
              console.warn(
                `Failed to remove matchMonitioring job for ${tournamentId}:`,
                err.message
              );
            }
            console.log(
              `All rooms finished for tournament ${tournamentId}. Proceeding to next round.`
            );
            await proceedToNextRound(tournamentId, SocketService.getIO());
            return;
          } else {
            console.log(
              `Not all rooms finished for tournament ${tournamentId}, re-adding match monitoring job.`
            );

            try {
              const existingJob = await tournamentQueue.getJob(
                `matchMonitioring-${tournamentId}`
              );
              if (existingJob) await existingJob.remove();
            } catch {}

            await tournamentQueue.add(
              "matchMonitioring",
              { tournamentId },
              { delay: 5000, jobId: `matchMonitioring-${tournamentId}` }
            );
          }
        }
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error; 
      }
    },
    {
      connection: env.REDIS_URL
        ? { url: env.REDIS_URL } 
        : {
            host: env.REDIS_HOST,
            port: Number(env.REDIS_PORT),
          },
      prefix: "bull:{tournament}",
    }
  );

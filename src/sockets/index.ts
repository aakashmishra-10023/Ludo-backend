import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient } from "../config/redis.config";
import {
  handleJoinRoom,
  handleMovePiece,
  handleRollDice,
  handleConnection,
  handleDisconnect,
} from "./handlers/index";
import { socketAuth, requireAuth } from "../middlewares/socketAuth.middleware";
import { GameRoom } from "../interfaces/room.interface";
import { assignPlayerToTournamentRoom, closeJoiningAndStart } from "./handlers/tournamentGame.handler";
import { TournamentModel } from "../models/tournament.schema";
import { tournamentQueue } from "../queues/tournament.queue";
import { Tournament } from "src/interfaces/tournament.interface";
import { handleTournamentMovePiece, handleTournamentRollDice } from "./handlers/tournament.handler";

export class SocketService {
  private static io: Server;

  constructor(httpServer: HttpServer) {
    SocketService.io = new Server(httpServer, {
      cors: { origin: "*", methods: ["GET", "POST"], credentials: true },
    });

    this.setupRedisAdapter();
    this.setupEventHandlers();
  }

  public static getIO(): Server {
    if (!SocketService.io) {
      throw new Error("Socket.IO not initialized");
    }
    return SocketService.io;
  }

  private async setupRedisAdapter() {
    try {
      const pubClient = redisClient.getClient();
      const subClient = pubClient.duplicate();

      SocketService.io.adapter(createAdapter(pubClient, subClient));
      console.log("Socket.IO Redis adapter initialized");
    } catch (error) {
      console.error("Failed to setup Redis adapter:", error);
    }
  }

  private setupEventHandlers() {
    SocketService.io.use(socketAuth);

    SocketService.io.on("connection", (socket: Socket) => {
      try {
        handleConnection(socket, SocketService.io);

        socket.use((event, next) => {
          requireAuth(socket, next);
        });

        socket.on("join_room", (data) => {
          handleJoinRoom(socket, SocketService.io, {
            ...data,
            userId: socket.data.user.id,
            userName: `Player_${socket.id.substring(0, 5)}`,
          });
        });

        socket.on("roll_dice", (data) => {
          handleRollDice(socket, SocketService.io, {
            ...data,
            userId: socket.data.user.id,
          });
        });

        socket.on("move_piece", (data) => {
          handleMovePiece(socket, SocketService.io, {
            ...data,
            userId: socket.data.user.id,
          });
        });

        socket.on("disconnect", () => {
          handleDisconnect(socket, SocketService.io);
        });

        socket.on("tournament_roll_dice", (data) => {
          handleTournamentRollDice(socket, SocketService.io, {
            ...data,
            userId: socket.data.user.id,
          });
        });

        socket.on("tournament_move_piece", (data) => {
          handleTournamentMovePiece(socket, SocketService.io, {
            ...data,
            userId: socket.data.user.id,
          });
        });
        

        socket.on("join_tournament", async ({ tournamentId }) => {
          const io = SocketService.getIO();
          const userId = socket.data.user.id;
        
          let tournament: Tournament = await redisClient.get(`tournament:${tournamentId}`);
        
          if (!tournament || !tournament.joiningOpen) {
            socket.emit("error", { message: "Tournament joining is closed" });
            return;
          }
        
          if (tournament.players.includes(userId)) {
            socket.emit("error", { message: "Already joined" });
            return;
          }
        
          // Assign player to a room (updates room in Redis and MongoDB)
          const roomId = await assignPlayerToTournamentRoom(tournamentId, userId);
        
          // Store room mapping
          await redisClient.set(`tournament:${tournamentId}:player:${userId}:room`, roomId);
          socket.join(`tournament:${tournamentId}`);

          // Notify others in the tournament
          socket.to(`tournament:${tournamentId}`).emit("player_joined", {
            userId,
            players: tournament.players,
          });
        
          // Fetch room from Redis
          const room: GameRoom = await redisClient.get(`room:${roomId}`);
          socket.emit("tournament_joined", {
            tournamentId,
            roomId,
            players: room.players,
            maxPlayers: room.players.length,
          });          
        
          console.log(`[Tournament] Player ${userId} joined tournament ${tournamentId} in room ${roomId}`);
        
          // Update top-level tournament players
          tournament.players.push(userId);
        
          // Fetch latest rooms from Redis to update the tournament object
          const roomIds: string[] = (await redisClient.get(`tournament:${tournamentId}:rooms`)) || [];
          tournament.rooms = [];
          for (const roomid of roomIds) {
            const room = await redisClient.get(`room:${roomid}`);
            tournament.rooms.push(room);
          }
        
          // Update Redis and MongoDB
          await redisClient.set(`tournament:${tournamentId}`, JSON.stringify(tournament));
          await TournamentModel.updateOne(
            { tournamentId },
            {
              $addToSet: { players: { userId, userName: `Player_${userId}` } },
              $set: { rooms: tournament.rooms },
            }
          );
        
          // Check if tournament reached player limit
          if (tournament.players.length >= tournament.playerLimit) {
            await closeJoiningAndStart(tournamentId, io);
            await tournamentQueue.removeRepeatable('closeJoiningAndStart', { jobId: tournamentId });
          }
        });        
      } catch (error) {
        console.error("Error in socket connection handler:", error);
        socket.emit("error", { message: "Connection error" });
        socket.disconnect(true);
      }
    });
  }

  public getIO(): Server {
    return SocketService.io;
  }
}

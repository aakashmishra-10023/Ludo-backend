import { Server, Socket } from "socket.io";
import { redisClient } from "../../config/redis.config";
import {
  GameRoom,
  JoinRoomData,
  Player,
} from "../../interfaces/room.interface";
import { GameState, PiecePosition } from "../../interfaces/game.interface";
import { GamePhase } from "../../enums/game.enum";
import { userService } from "../../services/user.service";
import { COLORS, MAX_PLAYERS } from "../../constants/constants";
import { TournamentModel } from "../../models/tournament.schema";

const generateRoomId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const handleJoinRoom = async (
  socket: Socket,
  io: Server,
  data: JoinRoomData
): Promise<void> => {
  try {
    const { userId, userName, createNewRoom } = data;
    let { roomId } = data;
    console.log("join room handler ====================>", userId, userName, createNewRoom, roomId);
    if (!userId || !userName) {
      socket.emit("error", { message: "User ID and userName are required" });
      return;
    }

    const existingRoomKey = await redisClient.get(`user:${userId}:room`);
    if (existingRoomKey) {
      socket.emit("error", { message: "You are already in a room" });
      return;
    }

    let room: GameRoom;

    if (createNewRoom === true || !roomId) {
      roomId = generateRoomId();

      room = {
        roomId,
        players: [],
        gameStarted: false,
        createdAt: Date.now(),
        createdBy: userId,
        maxPlayers: MAX_PLAYERS,
      };
    } else {
      room = await redisClient.get(`room:${roomId}`);

      if (!room) {
        socket.emit("error", { message: "Room does not exist" });
        return;
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit("error", { message: "Room is full" });
        return;
      }

      if (room.gameStarted) {
        socket.emit("error", { message: "Game has already started" });
        return;
      }
    }
    const user = await userService.getUser(userId);
    const player: Player = {
      userId,
      userName: user?.userName ?? userName,
      socketId: socket.id,
      avatarUrl: user?.avatarUrl || undefined,
      color: COLORS[room.players.length],
      isReady: true,
      position: room.players.length,
    };

    room.players.push(player);

    await redisClient.set(`room:${roomId}`, room);

    await redisClient.set(`user:${userId}:room`, roomId);

    socket.join(roomId);

    socket.emit("room_joined", {
      roomId,
      player,
      players: room.players,
      message: "Successfully joined the room",
    });

    socket.to(roomId).emit("player_joined", {
      roomId,
      player,
      players: room.players,
      message: `${player.userName} joined the room`,
    });

    if (room.players.length === room.maxPlayers) {
      await startGame(io, roomId);
    }

    console.log(
      `User ${userId} (${userName}) joined room ${roomId}. Current players: ${room.players.length}`
    );
  } catch (error) {
    console.error("Error in join room handler:", error);
    socket.emit("error", { message: "Error joining room" });
  }
};

export const startGame = async (io: Server, roomId: string): Promise<void> => {
  try {
    const room: GameRoom = await redisClient.get(`room:${roomId}`);

    if (!room) {
      console.error(`Room ${roomId} not found when trying to start game`);
      return;
    }

    if (room.gameStarted) {
      return;
    }

    const turnOrder = room.players.map((player: Player) => player.userId);
    const pieces: Record<string, PiecePosition[]> = {};
    turnOrder.forEach((userId: string) => {
      pieces[userId] = [
        { id: 0, position: -1, isHome: true, isFinished: false },
        { id: 1, position: -1, isHome: true, isFinished: false },
        { id: 2, position: -1, isHome: true, isFinished: false },
        { id: 3, position: -1, isHome: true, isFinished: false },
      ];
    });

    const gameState: GameState = {
      currentTurn: turnOrder[0],
      diceValue: 0,
      pieces,
      turnOrder,
      currentPlayerIndex: 0,
      gamePhase: GamePhase.Rolling,
    };

    room.gameStarted = true;
    room.gameState = gameState;

    await redisClient.set(`room:${roomId}`, room);

    io.to(roomId).emit("game_started", {
      roomId,
      gameState,
      players: room.players,
      message: "Game started!",
    });

    console.log(
      `Game started in room ${roomId} with ${room.players.length} players`
    );
  } catch (error) {
    console.error("Error starting game:", error);
    io.to(roomId).emit("error", { message: "Error starting game" });
  }
};

export const startTournamentGame = async (io: Server, tournamentId: string, roomId: string): Promise<void> => {
  try {
    const room: GameRoom = await redisClient.get(`room:${roomId}`);

    if (!room) {
      console.error(`Room ${roomId} not found for tournament ${tournamentId}`);
      return;
    }

    if (room.gameStarted) return;

    if (!room.players || room.players.length < 2) {
      console.warn(
        `Tournament ${tournamentId}: Cannot start game in room ${roomId} — only ${room.players.length} player(s).`
      );

      io.to(roomId).emit("game_not_started", {
        roomId,
        message:
          room.players.length === 0
            ? "Game cannot start — no players in the room."
            : "Waiting for more players to join before starting the game.",
      });

      return;
    }

    const turnOrder = room.players.map((player: Player) => player.userId);
    const pieces: Record<string, PiecePosition[]> = {};

    turnOrder.forEach((userId: string) => {
      pieces[userId] = [
        { id: 0, position: -1, isHome: true, isFinished: false },
        { id: 1, position: -1, isHome: true, isFinished: false },
        { id: 2, position: -1, isHome: true, isFinished: false },
        { id: 3, position: -1, isHome: true, isFinished: false },
      ];
    });

    const gameState: GameState = {
      currentTurn: turnOrder[0],
      diceValue: 0,
      pieces,
      turnOrder,
      currentPlayerIndex: 0,
      gamePhase: GamePhase.Rolling,
    };

    // Update room state
    room.gameStarted = true;
    room.gameState = gameState;

    // Save updated room in Redis
    await redisClient.set(`room:${roomId}`, JSON.stringify(room));

    // Update tournament document in MongoDB
    await TournamentModel.updateOne(
      { tournamentId, "rooms.roomId": roomId },
      { $set: { "rooms.$": room } }
    );

    // Emit to players in the room
    io.to(roomId).emit("game_started", {
      roomId,
      gameState,
      players: room.players,
      message: "Tournament game started!",
    });

    console.log(`Tournament ${tournamentId}: Game started in room ${roomId} with ${room.players.length} players`);
  } catch (error) {
    console.error(`Error starting tournament game in room ${roomId}:`, error);
    io.to(roomId).emit("error", { message: "Error starting tournament game" });
  }
};

export const handleStartGame = async (
  socket: Socket,
  io: Server,
  data: { roomId: string; userId: string }
): Promise<void> => {
  try {
    const { roomId, userId } = data;

    const room: GameRoom = await redisClient.get(`room:${roomId}`);
    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    if (room.gameStarted) {
      socket.emit("error", { message: "Game has already started" });
      return;
    }

    if (room.createdBy !== userId) {
      socket.emit("error", { message: "Only the room creator can start the game" });
      return;
    }

    if (room.players.length < 2) {
      socket.emit("error", { message: "At least 2 players are required to start the game" });
      return;
    }

    const turnOrder = room.players.map((player: Player) => player.userId);
    const pieces: Record<string, PiecePosition[]> = {};

    turnOrder.forEach((id) => {
      pieces[id] = [
        { id: 0, position: -1, isHome: true, isFinished: false },
        { id: 1, position: -1, isHome: true, isFinished: false },
        { id: 2, position: -1, isHome: true, isFinished: false },
        { id: 3, position: -1, isHome: true, isFinished: false },
      ];
    });

    const gameState: GameState = {
      currentTurn: turnOrder[0],
      diceValue: 0,
      pieces,
      turnOrder,
      currentPlayerIndex: 0,
      gamePhase: GamePhase.Rolling,
    };

    room.gameStarted = true;
    room.gameState = gameState;

    await redisClient.set(`room:${roomId}`, room);

    io.to(roomId).emit("game_started", {
      roomId,
      gameState,
      players: room.players,
      message: "Game started by room creator!",
    });

    console.log(`Room ${roomId}: Game started by ${userId}`);
  } catch (error) {
    console.error("Error starting game:", error);
    socket.emit("error", { message: "Error starting game" });
  }
};


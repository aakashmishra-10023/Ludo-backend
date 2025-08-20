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

const COLORS = ["red", "green", "yellow", "blue"];
const MAX_PLAYERS = 4;

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

    io.to(roomId).emit("start_game", {
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

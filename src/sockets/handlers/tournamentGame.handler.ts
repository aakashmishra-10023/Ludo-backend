import { redisClient } from "../../config/redis.config";
import { GameRoom } from "../../interfaces/room.interface";
import { startTournamentGame } from "./room.handler";
import { Server } from "socket.io";
import { generateRoomId } from "../../utils/common.utils";
import { Tournament } from "../../interfaces/tournament.interface";
import { TournamentModel } from "../../models/tournament";
import { tournamentQueue } from "../../queues/tournament.queue";
import { SocketService } from "..";

export async function assignPlayerToTournamentRoom(
  tournamentId: string,
  userId: string
): Promise<string> {
  const io = SocketService.getIO();
  const roomIds: string[] =
    (await redisClient.get(`tournament:${tournamentId}:rooms`)) || [];

  let room: GameRoom | undefined;

  for (const roomId of roomIds) {
    const r: GameRoom = await redisClient.get(`room:${roomId}`);
    if (r.players.length < r.maxPlayers && !r.gameStarted) {
      room = r;
      break;
    }
  }

  if (!room) {
    const roomId = generateRoomId(6);
    room = {
      roomId,
      tournamentId,
      players: [],
      gameStarted: false,
      gameState: null,
      createdAt: Date.now(),
      maxPlayers: 4,
    };

    roomIds.push(roomId);
    await redisClient.set(`tournament:${tournamentId}:rooms`, roomIds);
    await redisClient.set(`room:${roomId}`, JSON.stringify(room));

    await TournamentModel.updateOne(
      { tournamentId },
      { $push: { rooms: room } }
    );
  }

  const newPlayer = {
    userId,
    userName: `Player_${userId}`,
    socketId: "",
    isOnline: true,
  };

  room.players.push(newPlayer);

  await redisClient.set(`room:${room.roomId}`, JSON.stringify(room));

  return room.roomId;
}

// async function startTournament(tournamentId: string, io: Server) {
//   const tournament: Tournament = await redisClient.get(
//     `tournament:${tournamentId}`
//   );
//   tournament.joiningOpen = false;
//   await redisClient.set(`tournament:${tournamentId}`, tournament);

//   const rooms = tournament.rooms;
//   for (const room of rooms) {
//     await startTournamentGame(io, tournamentId, room.roomId);
//   }
// }

export async function proceedToNextRound(tournamentId: string, io: Server) {
  const tournament = await redisClient.get(
    `tournament:${tournamentId}`
  );
  
  if (!tournament || tournament.status === "COMPLETED"){
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
    return;
  }

  const winners: string[] = [];

  // Collect winners from all rooms of current round
  for (const room of tournament.rooms) {
    const roomData: GameRoom = await redisClient.get(`room:${room.roomId}`);
    if (roomData?.gameState?.winner) {
      winners.push(roomData.gameState.winner);
    }
  }

  // If only one winner left, tournament is over
  if (winners.length <= 1) {
    console.log(`Tournament is Over and here is the winner ${winners[0]}`);

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

    await TournamentModel.updateOne(
      { tournamentId },
      {
        $set: {
          status: "completed",
          winner: winners[0],
          endTime: new Date(),
        },
      }
    );
    tournament.status = "COMPLETED";
    tournament.winner = winners[0];
    tournament.endTime = new Date();
    await redisClient.set(
      `tournament:${tournamentId}`,
      JSON.stringify(tournament)
    );
    io.emit("tournament_over", { winner: winners[0] });
    return;
  }

  // Create rooms for next round
  const nextRoundRooms: GameRoom[] = [];
  for (let i = 0; i < winners.length; i += tournament.maxPlayersPerRoom) {
    const group = winners.slice(i, i + tournament.maxPlayersPerRoom);
    const roomId = generateRoomId(6);
    const room: GameRoom = {
      roomId,
      tournamentId,
      players: group.map((uid) => ({
        userId: uid,
        userName: `Player_${uid}`,
        socketId: "",
        isOnline: true,
      })),
      gameStarted: false,
      gameState: null,
      createdAt: Date.now(),
      maxPlayers: tournament.maxPlayersPerRoom,
    };
    nextRoundRooms.push(room);

    // Save each room in Redis
    await redisClient.set(`room:${roomId}`, JSON.stringify(room));
  }

  // Update tournament in Redis
  tournament.rooms = nextRoundRooms.map((room) => ({
    roomId: room.roomId,
    players: room.players.map((p) => ({
      userId: p.userId,
      userName: p.userName,
      socketId: p.socketId || "",
      isOnline: p.isOnline ?? true,
    })),
    gameStarted: room.gameStarted,
    gameState: room.gameState,
    createdAt: new Date(room.createdAt),
    maxPlayers: room.maxPlayers,
  }));
  tournament.currentRound++;
  await redisClient.set(`tournament:${tournamentId}`, JSON.stringify(tournament));

  // Update tournament in DB
  await TournamentModel.updateOne(
    { tournamentId },
    { $set: { rooms: nextRoundRooms, currentRound: tournament.currentRound } }
  );

  // Start games in all rooms
  for (const room of nextRoundRooms) {
    await startTournamentGame(io, tournamentId, room.roomId);
  }

  console.log(
    `[Tournament] Tournament ${tournamentId} Round ${tournament.currentRound} started`
  );
}

export const closeJoiningAndStart = async (
  tournamentId: string,
  io: Server
) => {
  let tournament = await redisClient.get(`tournament:${tournamentId}`);
  if (!tournament || !tournament.joiningOpen) return;

  tournament.joiningOpen = false;
  tournament.status = "IN_PROGRESS";
  await redisClient.set(`tournament:${tournamentId}`, JSON.stringify(tournament));
  await TournamentModel.updateOne(
    { tournamentId },
    {
      $set: { joiningOpen: false, status: "IN_PROGRESS" },
    }
  );

  const nextRoundRooms = await createRoomsForRound(
    tournament.tournamentId,
    tournament.players,
    tournament.maxPlayersPerRoom,
    io
  );

  tournament.rooms = nextRoundRooms;
  tournament.currentRound = 1;

  await redisClient.set(`tournament:${tournamentId}`, JSON.stringify(tournament));
  await TournamentModel.updateOne(
    { tournamentId },
    {
      $set: { rooms: nextRoundRooms, currentRound: 1 },
    }
  );

  for (const room of nextRoundRooms) {
    await startTournamentGame(io, tournamentId, room.roomId);
  }

  await tournamentQueue.add(
    "matchMonitioring",
    { tournamentId },
    { 
      repeat: {
        every: 5000 
      },
      jobId: `matchMonitioring-${tournamentId}` 
    }
  );

  console.log(`[Tournament] Tournament ${tournamentId} Round 1 started`);
};

export async function createRoomsForRound(
  tournamentId: string,
  players: string[],
  maxPlayersPerRoom: number,
  io: Server
): Promise<GameRoom[]> {
  const rooms: GameRoom[] = [];

  for (let i = 0; i < players.length; i += maxPlayersPerRoom) {
    const remaining = players.length - i;

    if (remaining === 1 && rooms.length > 0) {
      rooms[rooms.length - 1].players.push({
        userId: players[i],
        userName: `Player_${players[i]}`,
        socketId: (await redisClient.get(`user:${players[i]}:socket`)) || "",
        isOnline: !!(await redisClient.get(`user:${players[i]}:socket`)),
      });
      continue;
    }

    const group = players.slice(i, i + maxPlayersPerRoom);
    const roomId = generateRoomId(6);
    const roomPlayers = await Promise.all(
      group.map(async (uid) => {
        const socketId = await redisClient.get(`user:${uid}:socket`);
        return {
          userId: uid,
          userName: `Player_${uid}`,
          socketId: socketId || "",
          isOnline: !!socketId,
        };
      })
    );
    const room: GameRoom = {
      roomId,
      tournamentId: tournamentId,
      players: roomPlayers,
      gameStarted: false,
      gameState: null,
      createdAt: Date.now(),
      maxPlayers: maxPlayersPerRoom,
    };

    await redisClient.set(`room:${roomId}`, JSON.stringify(room));

    await TournamentModel.updateOne(
      { tournamentId },
      { $push: { rooms: room } }
    );

    rooms.push(room);

    for (const player of group) {
      const socketId = await redisClient.get(`user:${player}:socket`);
      if (socketId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.join(roomId);
          socket.emit("room_assigned", { roomId, tournamentId });
        }
      }
    }
  }

  return rooms;
}

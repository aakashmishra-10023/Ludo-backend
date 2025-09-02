import { Server, Socket } from "socket.io";
import { redisClient } from "../../config/redis.config";
import { GameRoom, Player } from "../../interfaces/room.interface";
import {
  MovePieceData,
  PiecePosition,
  RollDiceData,
} from "../../interfaces/game.interface";
import { GamePhase } from "../../enums/game.enum";
import { Tournament } from "../../interfaces/tournament.interface";
import { TournamentModel } from "../../models/tournament.schema";

export const handleTournamentRollDice = async (
  socket: Socket,
  io: Server,
  data: RollDiceData
): Promise<void> => {
  try {
    const { roomId, userId } = data;

    if (!roomId || !userId) return;

    const room: GameRoom = await redisClient.get(`room:${roomId}`);
    if (!room || !room.gameStarted) return;

    if (room.gameState.currentTurn !== userId) return;
    if (room.gameState.gamePhase !== GamePhase.Rolling) return;
    if (room.gameState.diceValue && room.gameState.diceValue > 0) return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    room.gameState.diceValue = diceValue;
    room.gameState.gamePhase = GamePhase.Moving;

    await redisClient.set(`room:${roomId}`, JSON.stringify(room));

    io.to(roomId).emit("dice_result", {
      roomId,
      userId,
      diceValue,
      gameState: room.gameState,
    });
  } catch (error) {
    console.error("Error in tournament roll dice:", error);
  }
};

export const handleTournamentMovePiece = async (
  socket: Socket,
  io: Server,
  data: MovePieceData & { tournamentId: string }
): Promise<void> => {
  try {
    const { roomId, pieceId, userId, tournamentId} = data;
    if (!roomId || !pieceId || !userId) return;

    const room: GameRoom = await redisClient.get(`room:${roomId}`);
    if (!room || !room.gameStarted) return;

    if (room.gameState.currentTurn !== userId) return;
    if (room.gameState.gamePhase !== GamePhase.Moving) return;

    const playerPieces = room.gameState.pieces[userId];
    const piece = playerPieces[pieceId];
    if (!piece || !isValidMove(piece, room.gameState.diceValue)) return;

    const newPosition = calculateNewPosition(piece, room.gameState.diceValue);
    piece.position = newPosition.position;
    piece.isHome = newPosition.isHome;
    piece.isFinished = newPosition.isFinished;

    await handleSpecialPositions(room, userId, piece, io);

    room.gameState.diceValue = 0;
    room.gameState.gamePhase = GamePhase.Rolling;

    const currentIndex = room.gameState.turnOrder.indexOf(userId);
    const nextIndex = (currentIndex + 1) % room.gameState.turnOrder.length;
    room.gameState.currentTurn = room.gameState.turnOrder[nextIndex];
    room.gameState.currentPlayerIndex = nextIndex;

    await redisClient.set(`room:${roomId}`, JSON.stringify(room));

    io.to(roomId).emit("piece_moved", {
      roomId,
      userId,
      pieceId,
      newPosition: piece,
      nextPlayer: room.gameState.currentTurn,
      gameState: room.gameState,
    });

    // Tournament win condition: if ANY piece is finished
    if (piece.isFinished) {
      await handleTournamentWin(tournamentId, room, userId, io);
    }
  } catch (error) {
    console.error("Error in tournament move piece:", error);
  }
};

// Tournament win: one piece finishes
async function handleTournamentWin(
  tournamentId: string,
  room: GameRoom,
  winnerId: string,
  io: Server
) {
  room.gameState.gamePhase = GamePhase.GameOver;
  room.gameState.diceValue = 0;
  (room.gameState as any).winner = winnerId;

  await redisClient.set(`room:${room.roomId}`, JSON.stringify(room));

  io.to(room.roomId).emit("game_over", {
    roomId: room.roomId,
    winnerId,
    finalState: room.gameState,
  });

  setTimeout(async () => {
    await redisClient.delete(`room:${room.roomId}`);
    await Promise.all(
      room.players.map((player: Player) =>
        redisClient.delete(`user:${player.userId}:room`)
      )
    );
  }, 60000);

  const tournament: Tournament = await redisClient.get(
    `tournament:${tournamentId}`
  );
  if (tournament && tournament.rooms) {
    const roomIndex = tournament.rooms.findIndex(
      (r) => r.roomId === room.roomId
    );
    if (roomIndex !== -1) {
        const mappedRoom = {
            roomId: room.roomId,
            players: room.players.map(p => ({
              userId: p.userId,
              userName: p.userName,
              socketId: p.socketId,
              isOnline: p.isOnline ?? true,
            })),
            gameStarted: room.gameStarted,
            gameState: room.gameState ?? {}, 
            createdAt: new Date(room.createdAt),
            maxPlayers: room.maxPlayers,
          };
          tournament.rooms[roomIndex] = mappedRoom;
    }

    await redisClient.set(`tournament:${tournamentId}`, JSON.stringify(tournament));
    await TournamentModel.updateOne(
      { tournamentId },
      { $set: { rooms: tournament.rooms } }
    );
  }
}

// Reuse your helper functions
function isValidMove(piece: PiecePosition, steps: number): boolean {
  if (piece.isFinished) return false;
  if (piece.isHome && steps !== 6) return false;
  if (!piece.isHome && piece.position + steps > 56) return false;
  return true;
}

function calculateNewPosition(piece: PiecePosition, steps: number) {
  if (piece.isHome) return { position: 0, isHome: false, isFinished: false };
  const newPos = piece.position + steps;
  if (newPos >= 56) return { position: 56, isHome: false, isFinished: true };
  return { position: newPos, isHome: false, isFinished: false };
}

async function handleSpecialPositions(
  room: GameRoom,
  playerId: string,
  piece: PiecePosition,
  io: Server
) {
  const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];
  if (safePositions.includes(piece.position)) return;

  for (const [otherId, pieces] of Object.entries(room.gameState.pieces) as [
    string,
    PiecePosition[]
  ][]) {
    if (otherId === playerId) continue;

    for (const otherPiece of pieces) {
      if (
        !otherPiece.isHome &&
        !otherPiece.isFinished &&
        otherPiece.position === piece.position
      ) {
        otherPiece.position = -1;
        otherPiece.isHome = true;

        io.to(room.roomId).emit("piece_captured", {
          roomId: room.roomId,
          playerId: otherId,
          pieceId: otherPiece.id,
          capturedBy: playerId,
        });
        break;
      }
    }
  }
}

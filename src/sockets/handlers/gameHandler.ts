import { Server, Socket } from 'socket.io';
import { redisClient } from '../../config/redis.config';
import { GameRoom } from 'src/interfaces/room.interface';
import { MovePieceData, PiecePosition, RollDiceData } from 'src/interfaces/game.interface';

export const handleRollDice = async (socket: Socket, io: Server, data: RollDiceData): Promise<void> => {
  try {
    const { roomId } = data;
    const userId = socket.data.user?.id;

    if (!roomId || !userId) {
      socket.emit('error', { message: 'Room ID and User ID are required.' });
      return;
    }

    const roomData = await redisClient.get(`room:${roomId}`);
    if (!roomData) {
      socket.emit('error', { message: 'Room not found.' });
      return;
    }

    const room: GameRoom = typeof roomData === 'string' ? JSON.parse(roomData) : roomData;

    if (!room.gameStarted) {
      socket.emit('error', { message: 'Game has not started yet.' });
      return;
    }

    const currentPlayer = room.players[room.gameState.currentTurn];
    if (currentPlayer.userId !== userId) {
      socket.emit('error', { message: 'It is not your turn.' });
      return;
    }

    if (room.gameState.dice !== null) {
      socket.emit('error', { message: 'Dice already rolled for this turn.' });
      return;
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;

    room.gameState.dice = diceValue;
    room.gameState.lastUpdated = Date.now();

    await redisClient.set(`room:${roomId}`, room);

    io.to(roomId).emit('dice_result', {
      roomId,
      userId,
      diceValue,
      gameState: room.gameState,
    });

    console.log(`User ${userId} in room ${roomId} rolled a ${diceValue}`);

  } catch (error) {
    console.error('Error in handleRollDice:', error);
    socket.emit('error', { message: 'An error occurred while rolling the dice.' });
  }
};

export const handleMovePiece = async (socket: Socket, io: Server, data: MovePieceData): Promise<void> => {
  try {
    const { roomId, pieceId, steps, userId } = data;

    if (!roomId || !pieceId || !steps || !userId) {
      socket.emit('error', { message: 'Invalid move data' });
      return;
    }

    const roomData = await redisClient.get(`room:${roomId}`);
    if (!roomData) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const room = typeof roomData === 'string' ? JSON.parse(roomData) : roomData;

    if (room.gameState.currentTurn !== userId) {
      socket.emit('error', { message: 'Not your turn' });
      return;
    }

    if (room.gameState.gamePhase !== 'moving') {
      socket.emit('error', { message: 'Cannot move now' });
      return;
    }

    const playerPieces = room.gameState.pieces[userId];
    if (!playerPieces || pieceId >= playerPieces.length) {
      socket.emit('error', { message: 'Invalid piece' });
      return;
    }

    const piece = playerPieces[pieceId];

    if (!isValidMove(piece, steps, playerPieces)) {
      socket.emit('error', { message: 'Invalid move' });
      return;
    }

    const newPosition = calculateNewPosition(piece, steps);
    piece.position = newPosition.position;
    piece.isHome = newPosition.isHome;
    piece.isFinished = newPosition.isFinished;

    await handleSpecialPositions(room, userId, piece, io);

    room.gameState.gamePhase = 'rolling';

    const currentPlayerIndex = room.gameState.turnOrder.indexOf(userId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % room.gameState.turnOrder.length;
    room.gameState.currentTurn = room.gameState.turnOrder[nextPlayerIndex];
    room.gameState.currentPlayerIndex = nextPlayerIndex;

    await redisClient.set(`room:${roomId}`, room);

    io.to(roomId).emit('piece_moved', {
      roomId,
      userId,
      pieceId,
      newPosition: piece,
      nextPlayer: room.gameState.currentTurn,
      gameState: room.gameState
    });

    if (checkWinCondition(playerPieces)) {
      await handleWinCondition(room, userId, io);
    }

  } catch (error) {
    console.error('Error in move_piece handler:', error);
    socket.emit('error', { message: 'Error processing move' });
  }
};

function isValidMove(piece: PiecePosition, steps: number, allPieces: PiecePosition[]): boolean {
  if (piece.isFinished) return false;
  if (piece.isHome && steps !== 6) return false;
  if (!piece.isHome && piece.position + steps > 56) return false;
}

function calculateNewPosition(piece: PiecePosition, steps: number): { position: number; isHome: boolean; isFinished: boolean } {
  if (piece.isHome) {
    return { position: 0, isHome: false, isFinished: false };
  }

  const newPosition = piece.position + steps;

  if (newPosition >= 56) {
    return { position: 0, isHome: false, isFinished: true };
  }

  return { position: newPosition, isHome: false, isFinished: false };
}

async function handleSpecialPositions(room: any, playerId: string, piece: PiecePosition, io: Server): Promise<void> {
  const safePositions = [0, 8, 13, 21, 26, 34, 39, 47];
  if (safePositions.includes(piece.position)) {
    return;
  }

  for (const [otherPlayerId, pieces] of Object.entries(room.gameState.pieces) as [string, PiecePosition[]][]) {
    if (otherPlayerId === playerId) continue;

    for (const otherPiece of pieces) {
      if (!otherPiece.isHome && !otherPiece.isFinished && otherPiece.position === piece.position) {
        otherPiece.position = -1;
        otherPiece.isHome = true;

        io.to(room.roomId).emit('piece_captured', {
          roomId: room.roomId,
          playerId: otherPlayerId,
          pieceId: otherPiece.id,
          capturedBy: playerId
        });

        break;
      }
    }
  }
}

function checkWinCondition(pieces: PiecePosition[]): boolean {
  return pieces.every(piece => piece.isFinished);
}

async function handleWinCondition(room: any, winnerId: string, io: Server): Promise<void> {
  room.gameState.gamePhase = 'gameOver';
  room.gameState.winner = winnerId;

  await redisClient.set(`room:${room.roomId}`, room);

  io.to(room.roomId).emit('game_over', {
    roomId: room.roomId,
    winnerId,
    finalState: room.gameState
  });

  await archiveGame(room);
}
async function archiveGame(room: any): Promise<void> {
  setTimeout(async () => {
    await redisClient.delete(`room:${room.roomId}`);
    await Promise.all(
      room.players.map((player: any) =>
        redisClient.delete(`user:${player.userId}:room`)
      )
    );
  }, 60000);
}
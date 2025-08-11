import { Server, Socket } from 'socket.io';
import { redisClient } from '../../config/redis.config';
import { GameRoom } from './roomHandler';

interface RollDiceData {
  roomId: string;
}

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

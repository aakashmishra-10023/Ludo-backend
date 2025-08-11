import { Server, Socket } from 'socket.io';
import { redisClient } from '../../config/redis.config';

interface JoinRoomData {
  roomId?: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  createNewRoom?: boolean;
}

interface Player {
  userId: string;
  username: string;
  socketId: string;
  avatarUrl?: string;
  color?: string;
  isReady?: boolean;
  position?: number;
}

export interface GameRoom {
  roomId: string;
  players: Player[];
  gameStarted: boolean;
  createdAt: number;
  maxPlayers: number;
  gameState?: any;
}

const COLORS = ['red', 'green', 'yellow', 'blue'];
const MAX_PLAYERS = 4;

export const handleJoinRoom = async (socket: Socket, io: Server, data: JoinRoomData): Promise<void> => {
  try {
    console.log("Joining room handler invoked with data:", data);
    const { userId, username, avatarUrl, createNewRoom } = data;
    let { roomId } = data;
    
    if (!userId || !username) {
      socket.emit('error', { message: 'User ID and username are required' });
      return;
    }

    const existingRoomKey = await redisClient.get(`user:${userId}:room`);
    if (existingRoomKey) {
      socket.emit('error', { message: 'You are already in a room' });
      return;
    }

    let room: GameRoom;
    
    if (createNewRoom === true || !roomId) {
      roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      room = {
        roomId,
        players: [],
        gameStarted: false,
        createdAt: Date.now(),
        maxPlayers: MAX_PLAYERS
      };
    } 
    else {
      const roomData = await redisClient.get(`room:${roomId}`);
      
      if (!roomData) {
        socket.emit('error', { message: 'Room does not exist' });
        return;
      }
      
      room = typeof roomData === 'string' ? JSON.parse(roomData) : roomData as GameRoom;
      
      if (room.players.length >= room.maxPlayers) {
        socket.emit('error', { message: 'Room is full' });
        return;
      }
      
      if (room.gameStarted) {
        socket.emit('error', { message: 'Game has already started' });
        return;
      }
    }
    
    const player: Player = {
      userId,
      username,
      socketId: socket.id,
      avatarUrl: avatarUrl || undefined,
      color: COLORS[room.players.length],
      isReady: false,
      position: room.players.length
    };
    
    room.players.push(player);
    
    await redisClient.set(`room:${roomId}`, room);
    
    await redisClient.set(`user:${userId}:room`, roomId);
    
    socket.join(roomId);
    
    socket.emit('room_joined', {
      roomId,
      player,
      players: room.players,
      message: 'Successfully joined the room'
    });
    
    socket.to(roomId).emit('player_joined', {
      roomId,
      player,
      players: room.players,
      message: `${username} joined the room`
    });
    
    if (room.players.length === room.maxPlayers) {
      await startGame(io, roomId);
    }
    
    console.log(`User ${userId} (${username}) joined room ${roomId}. Current players: ${room.players.length}`);
    
  } catch (error) {
    console.error('Error in join room handler:', error);
    socket.emit('error', { message: 'Error joining room' });
  }
};

export const startGame = async (io: Server, roomId: string): Promise<void> => {
  try {
    const roomData = await redisClient.get(`room:${roomId}`);
    
    if (!roomData) {
      console.error(`Room ${roomId} not found when trying to start game`);
      return;
    }
    
    const room = typeof roomData === 'string' ? JSON.parse(roomData) : roomData;
    
    if (room.gameStarted) {
      return;
    }
    
    const gameState: {
      currentTurn: number;
      dice: number | null;
      pieces: Record<string, Array<{id: number, position: string}>>;
      status: string;
      lastUpdated: number;
    } = {
      currentTurn: 0,
      dice: null,
      pieces: {},
      status: 'started',
      lastUpdated: Date.now()
    };
    
    room.players.forEach((player: Player) => {
      gameState.pieces[player.userId] = [
        { id: 0, position: 'home' },
        { id: 1, position: 'home' },
        { id: 2, position: 'home' },
        { id: 3, position: 'home' }
      ];
    });
    
    room.gameStarted = true;
    room.gameState = gameState;
    
    await redisClient.set(`room:${roomId}`, room);
    
    io.to(roomId).emit('start_game', {
      roomId,
      gameState,
      players: room.players,
      message: 'Game started!'
    });
    
    console.log(`Game started in room ${roomId} with ${room.players.length} players`);
    
  } catch (error) {
    console.error('Error starting game:', error);
    io.to(roomId).emit('error', { message: 'Error starting game' });
  }
};

import { Server, Socket } from 'socket.io';
import { redisClient } from '../../config/redis.config';

export const handleDisconnect = async (socket: Socket, io: Server): Promise<void> => {
  try {
    const userId = socket.data.user?.id;
    const socketId = socket.id;
    
    if (!userId) {
      console.log(`Unauthenticated socket ${socketId} disconnected`);
      return;
    }

    console.log(`User ${userId} disconnected (Socket ID: ${socketId})`);
    
    await Promise.all([
      redisClient.delete(`user:${userId}:socket`),
      redisClient.delete(`socket:${socketId}:user`)
    ]);
    
    socket.leave(`user_${userId}`);
    
    const roomKey = await redisClient.get(`user:${userId}:room`);
    
    if (roomKey) {
      const roomId = roomKey;
      const roomData = await redisClient.get(`room:${roomId}`);
      
      if (roomData) {
        const room = typeof roomData === 'string' ? JSON.parse(roomData) : roomData;
        
        const playerIndex = room.players.findIndex((p: any) => p.userId === userId);
        if (playerIndex !== -1) {
          room.players[playerIndex].isOnline = false;
          room.players[playerIndex].lastSeen = new Date().toISOString();
          
          await redisClient.set(`room:${roomId}`, room);
          
          io.to(roomId).emit('player_disconnected', { 
            roomId, 
            userId,
            player: room.players[playerIndex],
            message: 'Player has disconnected',
            remainingPlayers: room.players.filter((p: any) => p.isOnline).length,
            totalPlayers: room.players.length
          });
          
          if (room.gameStarted) {
          }
        }
        
        socket.leave(roomId);
      }
      
      await redisClient.delete(`user:${userId}:room`);
    }
    
    socket.broadcast.emit('user_offline', { userId });
    
  } catch (error) {
    console.error('Error in disconnect handler:', error);
  }
};

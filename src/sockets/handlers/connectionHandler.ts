import { Server, Socket } from 'socket.io';
import { redisClient } from '../../config/redis.config';

export const handleConnection = async (socket: Socket, io: Server): Promise<void> => {
  try {
    const userId = socket.data.user?.id;
    
    if (!userId) {
      console.warn(`Socket ${socket.id} connected without authentication`);
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect(true);
      return;
    }
    
    await Promise.all([
      redisClient.set(`user:${userId}:socket`, socket.id),
      redisClient.set(`socket:${socket.id}:user`, userId)
    ]);
    
    socket.join(`user_${userId}`);
    
    console.log(`User ${userId} connected with socket ${socket.id}`);
    
    socket.emit('connect_success', { 
      message: 'Successfully connected to Ludo game server',
      socketId: socket.id,
      userId
    });
    
    socket.broadcast.emit('user_online', { userId });
    
  } catch (error) {
    console.error('Error in connection handler:', error);
    socket.emit('error', { message: 'Connection error' });
  }
};

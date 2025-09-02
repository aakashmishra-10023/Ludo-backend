import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { redisClient } from '../config/redis.config';

interface JwtPayload {
  id: string;
  type: string;
  sub: string;
  iat: number;
  exp: number;
}

export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth?.token || 
                 (socket.handshake.headers.authorization?.split(' ')[1]);
    console.log("token ====================>", token);
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    
    if (decoded.sub !== 'auth') {
      return next(new Error('Authentication error: Invalid token type'));
    }

    const isBlacklisted = await redisClient.get(`token:${token}`);
    if (isBlacklisted) {
      return next(new Error('Authentication error: Token has been revoked'));
    }
    socket.data.user = {
      id: decoded.id,
      type: decoded.type
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    if (error instanceof Error) {
      return next(new Error(`Authentication error: ${error.message}`));
    }
    next(new Error('Authentication error: Invalid token'));
  }
};

export const requireAuth = (socket: Socket, next: (err?: Error) => void) => {
  if (!socket.data?.user?.id) {
    return next(new Error('Authentication required'));
  }
  next();
};

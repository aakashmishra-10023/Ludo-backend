import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient } from '../config/redis.config';
import { handleJoinRoom, handleMovePiece, handleRollDice, handleConnection, handleDisconnect } from './handlers/index';
import { socketAuth, requireAuth } from '../middlewares/socketAuth.middleware';

export class SocketService {
  private io: Server;

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupRedisAdapter();
    this.setupEventHandlers();
  }

  private async setupRedisAdapter() {
    try {
      const pubClient = redisClient.getClient();
      const subClient = pubClient.duplicate();

      this.io.adapter(createAdapter(pubClient, subClient));
      console.log('Socket.IO Redis adapter initialized');
    } catch (error) {
      console.error('Failed to setup Redis adapter:', error);
    }
  }

  private setupEventHandlers() {
    this.io.use(socketAuth);

    this.io.on('connection', (socket: Socket) => {
      try {
        handleConnection(socket, this.io);

        socket.use((event, next) => {
          requireAuth(socket, next);
        });

        socket.on('join_room', (data) => {
          handleJoinRoom(socket, this.io, {
            ...data,
            userId: socket.data.user.id,
            userName: `Player_${socket.id.substring(0, 5)}`
          });
        });

        socket.on('roll_dice', (data) => {
          handleRollDice(socket, this.io, {
            ...data,
            userId: socket.data.user.id
          });
        });

        socket.on('move_piece', (data) => {
          handleMovePiece(socket, this.io, {
            ...data,
            userId: socket.data.user.id
          });
        });

        socket.on('disconnect', () => {
          handleDisconnect(socket, this.io);
        });

      } catch (error) {
        console.error('Error in socket connection handler:', error);
        socket.emit('error', { message: 'Connection error' });
        socket.disconnect(true);
      }
    });
  }

  public getIO(): Server {
    return this.io;
  }
}

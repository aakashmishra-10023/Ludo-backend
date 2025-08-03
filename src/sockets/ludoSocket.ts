import { Server, Socket } from "socket.io";
import * as gameService from "../services/gameService";

export const initLudoSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    // Join room
    socket.on("joinRoom", ({ roomId }) => {
      socket.join(roomId);
    });

    // Game state updates (broadcast to room)
    socket.on("gameStateUpdate", ({ roomId, data }) => {
      io.to(roomId).emit("gameStateUpdate", data);
    });

    // Player actions (broadcast to room)
    socket.on("playerAction", ({ roomId, data }) => {
      io.to(roomId).emit("playerAction", data);
    });

    // Room updates (broadcast to room)
    socket.on("roomUpdate", ({ roomId, data }) => {
      io.to(roomId).emit("roomUpdate", data);
    });

    // Roll dice (call gameService, emit result)
    socket.on("rollDice", async ({ roomId, playerId }) => {
      try {
        const result = await gameService.rollDice(roomId, playerId);
        io.to(roomId).emit("diceRolled", { playerId, ...result });
      } catch (err: any) {
        socket.emit("error", { message: err.message });
      }
    });

    // Move piece (call gameService, emit result)
    socket.on(
      "movePiece",
      async ({ roomId, playerId, pieceId, targetPosition }) => {
        try {
          // TODO: Add move validation and update logic
          const result = await gameService.movePiece(roomId, {
            playerId,
            pieceId,
            targetPosition,
          });
          io.to(roomId).emit("pieceMoved", {
            playerId,
            pieceId,
            targetPosition,
            result,
          });
        } catch (err: any) {
          socket.emit("error", { message: err.message });
        }
      }
    );

    // Add more event handlers as needed
  });
};

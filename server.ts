import app from "./app";
import { env } from "./config/envConsts";
import connectDB from "./config/db";
import { logger } from "./utils/logger";
import { createServer } from "http";
import { Server } from "socket.io";
import { initLudoSocket } from "./sockets/ludoSocket";

const PORT = parseInt(env.PORT, 10) || 3000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

initLudoSocket(io);

connectDB()
  .then(() => {
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to connect to DB", err);
    process.exit(1);
  });

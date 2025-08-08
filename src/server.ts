import express, { Express } from "express";
import { createServer } from "http";
import { authContext } from "./constants.ts/constants";
import { env } from "./config/env.config";
import { mongoConnection } from "./databases/mongodb/mongodb.connection";
import { authRouter } from "./routes/auth.route";
import { SocketService } from "./sockets/socket.config";

class App{
    private app!: Express;            
    private port!: string;
    private authContext!: string;
    private socketService!: SocketService;
    
    constructor(){
        this.startApp();
    }

    startApp() {
        this.app = express();
        this.configureAppSettings();
        mongoConnection.initiateMongoConnection;
        this.loadContext()
        this.loadRouter();
        this.initServer();
    }

    configureAppSettings(){
        this.app.use(express.json());
        this.port = env.PORT;
    }

    loadContext(){
        this.authContext = authContext;
    }

    loadRouter(){
        this.app.use(this.authContext, authRouter.userRouter());
    }
 
    initServer(){
        const httpServer = createServer(this.app);        
        this.socketService = new SocketService(httpServer);
        httpServer.listen(this.port, () => {
            console.log(`Server is running on port: ${this.port}`);
            console.log(`Socket.IO server initialized`);
        });
    }
}(async () => {
    new App();
  })();
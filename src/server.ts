import express, { Express } from "express";
import { createServer } from "http";
import { appContext, authContext, tournamentContext } from "./constants.ts/constants";
import { env } from "./config/env.config";
import { mongoConnection } from "./databases/mongodb/mongodb.connection";
import { authRouter } from "./routes/auth.route";
import { SocketService } from "./sockets";
import { appRouter } from "./routes/app.route";
import { tournamentRouter } from "./routes/tournament.route";
import { worker } from "./workers/tournamentWorker";

class App{
    private app!: Express;            
    private port!: string;
    private authContext!: string;
    private appContext!: string;
    private tournamentContext!: string;
    
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
        this.appContext = appContext;
        this.tournamentContext = tournamentContext;
    }

    loadRouter(){
        this.app.use(this.authContext, authRouter.userRouter());
        this.app.use(this.appContext, appRouter.userRouter());
        this.app.use(this.tournamentContext, tournamentRouter.UseRouter());
    }
 
    initServer(){
        const httpServer = createServer(this.app);        
        new SocketService(httpServer);
        worker();
        httpServer.listen(this.port, () => {
            console.log(`Server is running on port: ${this.port}`);
            console.log(`Socket.IO server initialized`);
        });
    }
}(async () => {
    new App();
  })();
import express, { Express}  from "express";
import { authContext } from "./constants.ts/constants";
import { env } from "./config/env.config";
import { mongoConnection } from "./databases/mongodb/mongodb.connection";
import { authRouter } from "./routes/auth.route";

class App{
    private app!: Express;            
    private port!: string;
    private authContext!: string;
    
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
        this.app.listen(this.port, () => {
            console.log(`Server is running on port: ${this.port}`);
        })
    }
}(async () => {
    new App();
  })();
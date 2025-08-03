

import { Router } from "express";
import { authController } from "../controllers/auth.controller";

class AuthRouter {
    private router!: Router;
    constructor() {
        this.router = Router();
    }

    userRouter() {
        this.router.post(
            '/social',
            authController.socialSignIn
        );
        return this.router
    }
}
export const authRouter = new AuthRouter()
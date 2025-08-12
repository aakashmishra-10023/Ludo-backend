

import { Router } from "express";

class AuthRouter {
    private router!: Router;
    constructor() {
        this.router = Router();
    }

    userRouter() {
        this.router.get(
            '/',
            (req, res) => {
                res.status(200).json({ message: "Hello World!" })
            }
        );
        this.router.get(
            '/health',
            (req, res) => {
                res.status(200).json({ message: "Everything is fine" })
            }
        );
        return this.router
    }
}
export const appRouter = new AuthRouter()

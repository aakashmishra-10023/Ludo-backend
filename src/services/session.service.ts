import jwt from "jsonwebtoken";
import { env } from "../config/env.config";

class SessionService {

    constructor(
    ) { }

    create(userId: string, type: string): { authToken: string, refreshToken: string } {
        return {
            authToken: this.createAuthToken(userId, type),
            refreshToken: this.createRefreshToken(userId, type)
        }
    }
    
    createAuthToken(userId: string, type: string): string {
        const token = jwt.sign({ id: userId, type }, env.JWT_SECRET, { expiresIn: "1d", subject: 'auth' });
        return token;
    }

    createRefreshToken(userId: string, type: string): string {
        const token = jwt.sign({ id: userId, type }, env.JWT_SECRET, { expiresIn: "7d", subject: 'refresh' });
        return token;
    }
}

export const sessionService = new SessionService();
import { Request, Response } from "express"
import { SUCCESS_MESSAGE } from "../constants.ts/constants";
import { authService } from "../services/auth.service";

class AuthController {

    constructor() { }

    async socialSignIn(req: Request, res: Response) {
        const { socialType, socialId, name, email, avatarUrl } = req.body;
        try {
            const response = await authService.socialSignIn(name, email, socialType, socialId, avatarUrl);
            res.status(200).json({ message: SUCCESS_MESSAGE.SOCIAL_SIGNIN_SUCCESS, data: response });
        } catch (err) {
            throw err;
        }
    }
}

export const authController = new AuthController();
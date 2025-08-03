import { UserType } from "../constants.ts/constants";
import { $UserModel } from "../models/user.schema";
import { $sessionService } from "./session.service";

class AuthService {

    constructor(
    ) { }

    async socialSignIn(name: string, email: string, socialType: string, socialId: string): Promise<{ authToken: string, refreshToken: string }> {
        try {

            const user = await $UserModel.findOne({ socialType, socialId });
            if (user) {
                const session = $sessionService.create(user._id, UserType.Customer);
                return session;
            } else {
                const newUser = await $UserModel.create({ name, email, socialType, socialId });
                const session = $sessionService.create(newUser._id, UserType.Customer);
                return session;
            }

        } catch (error) {
            throw error;
        }
    }
}

export const $authService = new AuthService();
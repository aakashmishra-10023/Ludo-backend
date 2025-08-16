import { UserDocument, UserModel } from "../models/user.schema";

class UserService {

    constructor(
    ) { }

    async getUser(userId: string): Promise<UserDocument> {
        try {
            const user = await UserModel.findOne({ _id: userId });
            return user;
        } catch (error) {
            throw error;
        }
    }
}

export const userService = new UserService();
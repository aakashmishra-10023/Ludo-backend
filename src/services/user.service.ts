import { Types } from "mongoose";
import { UserDocument, UserModel } from "../models/user.schema";

class UserService {

    constructor(
    ) { }

    async getUser(userId: string): Promise<UserDocument> {
        try {
            const user = await UserModel.findOne({ _id: new Types.ObjectId(userId) });
            return user;
        } catch (error) {
            throw error;
        }
    }
}

export const userService = new UserService();
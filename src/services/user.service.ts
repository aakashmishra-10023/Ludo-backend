import { Types } from "mongoose";
import { UserDocument, UserModel } from "../models/user.schema";

class UserService {

    constructor(
    ) { }

    async getUser(userId: string) {
        try {
            const user = await UserModel.findOne({ _id: new Types.ObjectId(userId) }).lean();
            return user;
        } catch (error) {
            throw error;
        }
    }
}

export const userService = new UserService();
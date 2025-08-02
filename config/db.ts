import mongoose from "mongoose";
import { env } from "./envConsts";

const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed", error);
  }
};
export default connectDB;

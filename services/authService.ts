import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { env } from "../config/envConsts";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  profilePicture: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function registerUser(data: z.infer<typeof registerSchema>) {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new Error("User already exists");
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = new User({
    email: data.email,
    password: hashedPassword,
    displayName: data.displayName,
    profilePicture: data.profilePicture,
  });
  await user.save();
  const userObj = user.toObject() as any;
  userObj.password = undefined; // Remove password from response
  return userObj;
}

export async function loginUser(data: z.infer<typeof loginSchema>) {
  const user = await User.findOne({ email: data.email });
  if (!user) throw new Error("Invalid credentials");
  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) throw new Error("Invalid credentials");
  const token = jwt.sign({ id: user._id, email: user.email }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
  const userObj = user.toObject() as any;
  userObj.password = undefined; // Remove password from response
  return { user: userObj, token };
}

export async function anonymousSignIn() {
  // Stub: In production, integrate with Firebase Auth
  const token = jwt.sign({ guest: true }, env.JWT_SECRET, { expiresIn: "1d" });
  return { token };
}

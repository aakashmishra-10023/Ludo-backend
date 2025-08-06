// import { Request, Response } from "express";
// import * as authService from "../services/authService";

// export const register = async (req: Request, res: Response) => {
//   try {
//     const data = authService.registerSchema.parse(req.body);
//     const user = await authService.registerUser(data);
//     res.status(201).json({ user });
//   } catch (err: any) {
//     res.status(400).json({ error: err.message });
//   }
// };

// export const login = async (req: Request, res: Response) => {
//   try {
//     const data = authService.loginSchema.parse(req.body);
//     const { user, token } = await authService.loginUser(data);
//     res.status(200).json({ user, token });
//   } catch (err: any) {
//     res.status(400).json({ error: err.message });
//   }
// };

// export const anonymousSignIn = async (req: Request, res: Response) => {
//   try {
//     const { token } = await authService.anonymousSignIn();
//     res.status(200).json({ token });
//   } catch (err: any) {
//     res.status(400).json({ error: err.message });
//   }
// };

// export const getProfile = async (req: Request, res: Response) => {};
// export const updateProfile = async (req: Request, res: Response) => {};
// export const getStatistics = async (req: Request, res: Response) => {};
// export const getAchievements = async (req: Request, res: Response) => {};

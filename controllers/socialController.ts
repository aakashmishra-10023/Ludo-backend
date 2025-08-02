import { Request, Response } from "express";
import * as socialService from "../services/socialService";

export const addFriend = async (req: Request, res: Response) => {
  // TODO: Implement addFriend logic
  res.status(200).json({});
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  // TODO: Implement acceptFriendRequest logic
  res.status(200).json({});
};

export const getFriendsList = async (req: Request, res: Response) => {
  // TODO: Implement getFriendsList logic
  res.status(200).json([]);
};

export const sendGameInvitation = async (req: Request, res: Response) => {
  // TODO: Implement sendGameInvitation logic
  res.status(200).json({});
};

export const acceptGameInvitation = async (req: Request, res: Response) => {
  // TODO: Implement acceptGameInvitation logic
  res.status(200).json({});
};
